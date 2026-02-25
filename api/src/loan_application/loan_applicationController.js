const {
  responseSuccess,
  responseWithError,
} = require("../../helper/messageResponse");
const loan_applicationService = require("./loan_applicationService");
const models = require("../../../models");
const Paginator = require("../../commons/paginator");
const notiService = require("../notifications/notiService");
const { notiFcm } = require("../../helper/fcm");
const borrower_informationService = require("../borrower_information/borrower_informationService");
const loan_informationService = require("../loan_information/loan_informationService");
const disbursementService = require("../disbursement/disbursementService");
const repaymentService = require("../repayment/repaymentService");
const logger = require("../../../winston");
const { ErrorCodes } = require("../../helper/constants");
const { host } = require("../../../config/config.json");
const { Op } = require("sequelize");
const complianceService = require("../cic/complianceService");

// getMyLoanApplication
exports.getMyLoanApplication = async (req, res) => {
  try {
    const { status, time_loan, loan_amount } = req.query;
    let condition = {
      user_id: req.user.id,
    };
    let loan_application = await loan_applicationService.getAllPaging(
      condition
    );
    if (loan_application.length === 0) {
      return res.json(responseSuccess([]));
    } else {
      if (status) {
        let selectedStatus = status
          .split(",")
          .map((ele) => parseInt(ele.trim()));
        if (selectedStatus.some(isNaN)) {
          return res.json(
            responseWithError(
              ErrorCodes.ERROR_CODE_INVALID_PARAMETER,
              "Tham số trạng thái truyền vào không hợp lệ!"
            )
          );
        }
        if (selectedStatus.length === 1) {
          selectedStatus = selectedStatus[0];
          loan_application = loan_application.filter(
            (item) => item.status === selectedStatus
          );
        } else {
          loan_application = loan_application.filter((item) =>
            selectedStatus.includes(item.status)
          );
        }
      }
      if (loan_amount) {
        const loan_amountRange = loan_amount.split("-");
        if (loan_amountRange.length === 2) {
          const [minLoanAmount, maxLoanAmount] = loan_amountRange.map(
            (loan_amountValue) => parseFloat(loan_amountValue)
          );
          if (!isNaN(minLoanAmount) && !isNaN(maxLoanAmount)) {
            loan_application = loan_application.filter(
              (ele) =>
                ele.loan_information.loan_amount >= minLoanAmount &&
                ele.loan_information.loan_amount <= maxLoanAmount
            );
          }
        }
      }
      if (time_loan) {
        const time_loanRange = time_loan.split("-");
        if (time_loanRange.length === 2) {
          const [minLoanAmount, maxLoanAmount] = time_loanRange.map(
            (time_loanValue) => parseInt(time_loanValue)
          );
          if (!isNaN(minLoanAmount) && !isNaN(maxLoanAmount)) {
            loan_application = loan_application.filter(
              (ele) =>
                ele.loan_information.time_loan >= minLoanAmount &&
                ele.loan_information.time_loan <= maxLoanAmount
            );
          }
        }
      }
      const currentPage = parseInt(req.query.page_index) || 1;
      const perPage = parseInt(req.query.page_size);
      const totalItems = loan_application.length;
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = currentPage * perPage;
      const paginatedData = loan_application.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalItems / perPage);
      const response = {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: currentPage,
        data: paginatedData,
      };
      res.json(responseSuccess(response, "Danh sách yêu cầu vay của bạn"));
    }
  } catch (error) {
    console.log(error);
    res.json(responseWithError(error));
  }
};

//getById
exports.getById = async (req, res) => {
  try {
    let id = req.params.id;
    let data = await loan_applicationService.getById(id);
    res.json(responseSuccess(data));
  } catch (error) {
    logger.error("getById loan_application", error);
    res.json(responseWithError(error));
  }
};

//acceptLoanApplication
exports.acceptLoanApplication = async (req, res) => {
  try {
    let id = req.body.loan_application_id;
    const data = {
      status: req.body.status,
      updated_date: new Date(),
    };
    let loan_application = await loan_applicationService.getById(id);
    if (!loan_application) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
          "Yêu cầu vay không tồn tại"
        )
      );
    }
    await models.loan_application.update(data, {
      where: { id: loan_application.id },
      deleted: 0,
    });
    const optionStatus = (item) => {
      switch (item) {
        case 1:
          return (
            "Yêu cầu vay có mã " +
            loan_application.code_transaction +
            " của bạn đang trong trạng thái chờ xét duyệt"
          );
        case 2:
          return (
            "Yêu cầu vay có mã " +
            loan_application.code_transaction +
            " của bạn đang trong trạng thái xét duyệt"
          );
        case 3:
          return (
            "Yêu cầu vay có mã " +
            loan_application.code_transaction +
            " của bạn bị từ chối"
          );
        case 4:
          return (
            "Yêu cầu vay có mã " +
            loan_application.code_transaction +
            " của bạn đã được giải ngân hãy theo dõi trong mục Giao Dịch"
          );
        case 5:
          return (
            "Yêu cầu vay có mã " +
            loan_application.code_transaction +
            " của bạn đã tất toán thành công"
          );
        default:
          break;
      }
    };
    const payload = {
      notifications: {
        title: `Thông báo trạng thái yêu cầu đơn vay`,
        body: optionStatus(data.status),
        name: `Thông báo trạng thái yêu cầu đơn vay`,
        content: `${optionStatus(data.status)}`,
        type_id: loan_application.id.toString(),
        type: "3",
        deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${loan_application.id}`,
        user_id: loan_application.user_id.toString(),
      },
    };
    const noti = await notiService.create(payload.notifications);
    notiFcm(loan_application.user_id, payload.notifications, noti.id);
    if (data.status == 3) {
      await loan_application.update(
        { deleted: 1 },
        { where: { id: loan_application.id } }
      );
      let borrower_information = await borrower_informationService.getById(
        loan_application.borrower_information_id
      );
      if (borrower_information) {
        await borrower_information.update(
          { deleted: 1, updated_date: new Date() },
          { where: { id: borrower_information.id, deleted: 0 } }
        );
        let loan_information = await loan_informationService.getById(
          loan_application.loan_information_id
        );
        if (loan_information) {
          await models.loan_information.update(
            { deleted: 1, updated_date: new Date() },
            { where: { id: loan_information.id }, deleted: 0 }
          );
        }
      }
      return res.json(
        responseSuccess({
          message: "Yêu cầu vay của bạn bị huỷ do không đạt các tiêu chí!",
        })
      );
    }
    if (data.status == 4) {
      await models.loan_application.update(
        { is_pay: 1, updated_date: new Date() },
        { where: { id: loan_application.id, deleted: 0 } }
      );
      let borrower_information = await borrower_informationService.getById(
        loan_application.borrower_information_id
      );
      if (borrower_information) {
        await models.borrower_information.update(
          { status: 1, updated_date: new Date() },
          { where: { id: borrower_information.id, deleted: 0, status: 0 } }
        );
      }
      let loan_information = await loan_informationService.getIdByUserId(
        loan_application.user_id
      );
      if (loan_information) {
        await models.loan_information.update(
          { is_check: 1, updated_date: new Date() },
          { where: { id: loan_information.id, deleted: 0, is_check: 0 } }
        );
      }
      let transaction_detail = await models.transaction.findOne({
        where: {
          user_id: loan_application.user_id,
          status: 0,
          deleted: 0,
        },
      });
      if (!transaction_detail) {
        let transaction = {
          user_id: loan_application.user_id,
          loan_application_id: loan_application.id,
        };
        await models.transaction.create(transaction);
      }
    }
    if (data.status == 5) {
      // Kiểm tra xem đã cộng điểm cho yêu cầu vay này hay chưa
      const hasPointsBeenAdded = await models.credit_point.findOne({
        where: {
          loan_application_id: loan_application.id,
        },
      });
      if (!hasPointsBeenAdded) {
        await models.loan_application.update(
          { is_pay: 2, updated_date: new Date() },
          { where: { id: loan_application.id, deleted: 0 } }
        );
        let credit_point = 25; //điểm mặc định khi người dùng mỗi lần hoàn thành một đơn vay
        let data = {
          user_id: loan_application.user_id,
          credit_point: credit_point,
          loan_application_id: loan_application.id,
        };
        await models.credit_point.create(data);
      }
    }
    res.json(responseSuccess());
  } catch (error) {
    logger.error("acceptLoanApplication loan_application", error);
    res.json(responseWithError(error));
  }
};

//cancerLoanApplication
exports.cancerLoanApplication = async (req, res) => {
  try {
    let id = req.params.id;
    let loan_application = await loan_applicationService.getById(id);
    if (loan_application) {
      if (loan_application.status == 1 || loan_application.status == 0) {
        await models.loan_application.update(
          { deleted: 1, status: 3, updated_date: new Date() },
          { where: { id: loan_application.id, deleted: 0 } }
        );
        let borrower_information = await borrower_informationService.getById(
          loan_application.borrower_information_id
        );
        if (borrower_information) {
          await borrower_information.update(
            { deleted: 1, updated_date: new Date() },
            { where: { id: borrower_information.id, deleted: 0 } }
          );
          let loan_information = await loan_informationService.getById(
            loan_application.loan_information_id
          );
          if (loan_information) {
            await models.loan_information.update(
              { deleted: 1, updated_date: new Date() },
              { where: { id: loan_information.id }, deleted: 0 }
            );
          }
        }
        res.json(responseSuccess({ message: "Huỷ yêu cầu vay thành công!" }));
      } else {
        res.json(
          responseWithError(
            ErrorCodes.ERROR_CODE_DONT_CANCER,
            "Bạn không thể hủy vì hồ sơ đang trong quá trình xét duyệt!"
          )
        );
      }
    } else {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
          "Yêu cầu vay không tồn tại"
        )
      );
    }
  } catch (error) {
    logger.error("cancer loan_application", error);
    res.json(responseWithError(error));
  }
};

//dueThisMonth
exports.dueThisMonth = async (req, res) => {
  try {
    let loan_application = await loan_applicationService.getIdByUserId(
      req.user.id
    );
    if (loan_application) {
      let loan_information = await models.loan_information.findOne({
        where: {
          user_id: req.user.id,
          is_check: 1,
          deleted: 0,
        },
        order: [["updated_date", "DESC"]],
      });
      if (loan_information) {
        for (let ele of loan_application) {
          let startDate = new Date(ele.application_date);
          let notiDate = [];

          for (let i = 1; i <= loan_information.time_loan; i++) {
            // Tính toán tháng cần thông báo đóng tiền
            let dueMonth = new Date(startDate);
            dueMonth.setMonth(dueMonth.getMonth() + i);
            notiDate.push(dueMonth);
          }
          const payload = {
            notifications: {
              title: `Thông báo hạn đóng tiền`,
              body: `Thông báo hạn đóng tiền tháng mới: ${loan_information.payment_per_period.toLocaleString()}vnd của đơn vay ${
                ele.code_transaction
              }`,
              name: `Thông báo hạn đóng tiền tháng mới: ${loan_information.payment_per_period.toLocaleString()}vnd của đơn vay ${
                ele.code_transaction
              }`,
              content: `Thông báo hạn đóng tiền tháng mới: ${loan_information.payment_per_period.toLocaleString()}vnd của đơn vay ${
                ele.code_transaction
              }`,
              type_id: ele.id.toString(),
              type: "6",
              deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${ele.id}`,
              user_id: ele.user_id.toString(),
            },
          };
          // Tạo thông báo cho các tháng cần thông báo đóng tiền
          for (let dueDate of notiDate) {
            const currentDate = new Date();
            if (
              dueDate.getFullYear() === currentDate.getFullYear() &&
              dueDate.getMonth() === currentDate.getMonth()
            ) {
              // Thực hiện thông báo cho tháng tiếp theo
              const noti = await notiService.create(payload.notifications);
              notiFcm(ele.user_id, payload.notifications, noti.id);
            }
          }
        }
        res.json(responseSuccess());
      } else {
        return res.json(
          responseWithError(
            ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
            "Số tiền vay yêu cầu không tồn tại!"
          )
        );
      }
    } else {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
          "Yêu cầu vay không tồn tại"
        )
      );
    }
  } catch (error) {
    logger.error("dueThisMonth loan_application", error);
    res.json(responseWithError(error));
  }
};

//getAllPAging
exports.getAllPAging = async (req, res) => {
  try {
    const { status, time_loan, loan_amount } = req.query;
    let loan_application = await models.loan_application.findAll({
      where: {
        [Op.or]: [{ deleted: 0 }, { deleted: 1 }],
      },
      include: [
        {
          model: models.users,
          attributes: ["id", "full_name", "avatar"],
        },
        {
          model: models.borrower_information,
          include: [
            {
              model: models.users,
            },
          ],
        },
        {
          model: models.loan_information,
          attributes: ["time_loan", "loan_amount"],
        },
      ],
      order: [["updated_date", "DESC"]],
    });
    if (loan_application.length === 0) {
      return res.json(responseSuccess([]));
    } else {
      if (status) {
        let selectedStatus = status
          .split(",")
          .map((ele) => parseInt(ele.trim()));
        if (selectedStatus.some(isNaN)) {
          return res.json(
            responseWithError(
              ErrorCodes.ERROR_CODE_INVALID_PARAMETER,
              "Tham số trạng thái truyền vào không hợp lệ!"
            )
          );
        }
        if (selectedStatus.length === 1) {
          selectedStatus = selectedStatus[0];
          loan_application = loan_application.filter(
            (item) => item.status === selectedStatus
          );
        } else {
          loan_application = loan_application.filter((item) =>
            selectedStatus.includes(item.status)
          );
        }
      }
      if (loan_amount) {
        const loan_amountRange = loan_amount.split("-");
        if (loan_amountRange.length === 2) {
          const [minLoanAmount, maxLoanAmount] = loan_amountRange.map(
            (loan_amountValue) => parseFloat(loan_amountValue)
          );
          if (!isNaN(minLoanAmount) && !isNaN(maxLoanAmount)) {
            loan_application = loan_application.filter(
              (ele) =>
                ele.loan_information.loan_amount >= minLoanAmount &&
                ele.loan_information.loan_amount <= maxLoanAmount
            );
          }
        }
      }
      if (time_loan) {
        const time_loanRange = time_loan.split("-");
        if (time_loanRange.length === 2) {
          const [minLoanAmount, maxLoanAmount] = time_loanRange.map(
            (time_loanValue) => parseInt(time_loanValue)
          );
          if (!isNaN(minLoanAmount) && !isNaN(maxLoanAmount)) {
            loan_application = loan_application.filter(
              (ele) =>
                ele.loan_information.time_loan >= minLoanAmount &&
                ele.loan_information.time_loan <= maxLoanAmount
            );
          }
        }
      }
      const currentPage = parseInt(req.query.page_index) || 1;
      const perPage = parseInt(req.query.page_size);
      const totalItems = loan_application.length;
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = currentPage * perPage;
      const paginatedData = loan_application.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalItems / perPage);
      const response = {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: currentPage,
        data: paginatedData,
      };
      res.json(responseSuccess(response));
    }
  } catch (error) {
    logger.error("getAllPaging loan_application", error);
    res.json(responseWithError(error));
  }
};

// ============ compliance check apis (finance.docx steps 6-9) ============

// submit loan application with cic/pep/sdn/blacklist compliance check
// follows finance.docx flow 3.7 (steps 6-9)
exports.submitLoanApplication = async (req, res) => {
  try {
    const loanApplicationId = req.params.id;

    // Lấy thông tin yêu cầu vay
    const loanApplication = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
      include: [
        { model: models.borrower_information },
        { model: models.loan_information },
        {
          model: models.users,
          attributes: ["id", "full_name", "phone", "email"],
        },
      ],
    });

    if (!loanApplication) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
          "Yêu cầu vay không tồn tại"
        )
      );
    }

    // check permission (owner or admin only)
    if (loanApplication.user_id !== req.user.id && req.user.role !== "admin") {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_PERMISSION_DENIED,
          "Bạn không có quyền thực hiện thao tác này"
        )
      );
    }

    // check status (only submit when draft/pending)
    if (loanApplication.status > 1) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_INVALID_PARAMETER,
          "Yêu cầu vay đã được submit trước đó"
        )
      );
    }

    const borrowerInfo = loanApplication.borrower_information;
    const user = loanApplication.user;

    // prepare data for compliance check
    const complianceData = {
      cccd: borrowerInfo?.cccd || borrowerInfo?.id_card,
      msdn: borrowerInfo?.business_registration_number || null,
      customerName: user?.full_name || borrowerInfo?.full_name,
      customerType: borrowerInfo?.customer_type || 1,
      phone: user?.phone,
      email: user?.email,
      passport: borrowerInfo?.passport,
      loanApplicationId: loanApplication.id,
      userId: loanApplication.user_id,
    };

    // === steps 6-9: run cic/pep/sdn/blacklist compliance check ===
    logger.info(
      `Starting compliance check for loan application ${loanApplicationId}`
    );
    const complianceResult = await complianceService.runFullComplianceCheck(
      complianceData
    );

    // save compliance result
    await complianceService.saveComplianceResult(
      loanApplicationId,
      complianceResult
    );

    // handle result per steps 7 and 9
    if (
      complianceResult.overallStatus ===
      complianceService.COMPLIANCE_STATUS.FAILED
    ) {
      // reject loan application
      await models.loan_application.update(
        {
          status: 3, // Từ chối
          rejection_reason: complianceResult.rejectionReasons.join("; "),
          updated_date: new Date(),
        },
        { where: { id: loanApplicationId } }
      );

      // send rejection notification
      const payload = {
        title: "Yêu cầu vay bị từ chối",
        body: `Yêu cầu vay ${loanApplication.code_transaction} không đạt yêu cầu kiểm tra tín dụng.`,
        name: "Yêu cầu vay bị từ chối",
        content: complianceResult.rejectionReasons.join("; "),
        type_id: loanApplication.id.toString(),
        type: "3",
        deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${loanApplication.id}`,
        user_id: loanApplication.user_id.toString(),
      };
      const noti = await notiService.create(payload);
      notiFcm(loanApplication.user_id, payload, noti.id);

      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_COMPLIANCE_FAILED || "COMPLIANCE_FAILED",
          "Yêu cầu vay không đạt yêu cầu kiểm tra tín dụng",
          {
            complianceStatus: complianceResult.overallStatus,
            rejectionReasons: complianceResult.rejectionReasons,
            cicTransactionCode: complianceResult.checks.cic?.transactionCode,
          }
        )
      );
    }

    if (
      complianceResult.overallStatus ===
      complianceService.COMPLIANCE_STATUS.REVIEW_REQUIRED
    ) {
      // move to review required status (admin review)
      await models.loan_application.update(
        {
          status: 1, // Chờ xét duyệt
          compliance_status: "REVIEW_REQUIRED",
          updated_date: new Date(),
        },
        { where: { id: loanApplicationId } }
      );

      return res.json(
        responseSuccess(
          {
            message: "Yêu cầu vay cần được xét duyệt thêm",
            complianceStatus: complianceResult.overallStatus,
            warnings: complianceResult.warnings,
            cicTransactionCode: complianceResult.checks.cic?.transactionCode,
          },
          "Yêu cầu vay đã được gửi và đang chờ xét duyệt"
        )
      );
    }

    // compliance passed - step 10: move to pending approval
    await models.loan_application.update(
      {
        status: 1, // Chờ xét duyệt
        compliance_status: "PASSED",
        updated_date: new Date(),
      },
      { where: { id: loanApplicationId } }
    );

    // send success notification
    const payload = {
      title: "Yêu cầu vay đã được gửi",
      body: `Yêu cầu vay ${loanApplication.code_transaction} đã qua kiểm tra tín dụng và đang chờ xét duyệt.`,
      name: "Yêu cầu vay đã được gửi",
      content: `Yêu cầu vay ${loanApplication.code_transaction} đã qua kiểm tra tín dụng và đang chờ xét duyệt.`,
      type_id: loanApplication.id.toString(),
      type: "3",
      deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${loanApplication.id}`,
      user_id: loanApplication.user_id.toString(),
    };
    const noti = await notiService.create(payload);
    notiFcm(loanApplication.user_id, payload, noti.id);

    res.json(
      responseSuccess(
        {
          loanApplicationId: loanApplication.id,
          complianceStatus: complianceResult.overallStatus,
          cicTransactionCode: complianceResult.checks.cic?.transactionCode,
          cicTotalDebt: complianceResult.checks.cic?.details?.totalDebtP2P || 0,
        },
        "Yêu cầu vay đã được gửi thành công"
      )
    );
  } catch (error) {
    logger.error("submitLoanApplication error:", error);
    res.json(responseWithError(error));
  }
};

// get compliance check result for loan application
exports.getComplianceResult = async (req, res) => {
  try {
    const loanApplicationId = req.params.id;

    const loanApplication = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
      attributes: [
        "id",
        "code_transaction",
        "compliance_status",
        "compliance_checked",
        "compliance_check_date",
        "compliance_result",
        "cic_checked",
        "cic_check_date",
        "cic_transaction_code",
        "cic_total_debt",
        "cic_has_bad_debt",
      ],
    });

    if (!loanApplication) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
          "Yêu cầu vay không tồn tại"
        )
      );
    }

    // parse compliance result
    let complianceDetails = null;
    if (loanApplication.compliance_result) {
      try {
        complianceDetails = JSON.parse(loanApplication.compliance_result);
      } catch (e) {
        complianceDetails = null;
      }
    }

    res.json(
      responseSuccess({
        loanApplicationId: loanApplication.id,
        codeTransaction: loanApplication.code_transaction,
        complianceStatus: loanApplication.compliance_status,
        complianceChecked: loanApplication.compliance_checked === 1,
        complianceCheckDate: loanApplication.compliance_check_date,
        cicChecked: loanApplication.cic_checked === 1,
        cicCheckDate: loanApplication.cic_check_date,
        cicTransactionCode: loanApplication.cic_transaction_code,
        cicTotalDebt: loanApplication.cic_total_debt,
        cicHasBadDebt: loanApplication.cic_has_bad_debt === 1,
        details: complianceDetails,
      })
    );
  } catch (error) {
    logger.error("getComplianceResult error:", error);
    res.json(responseWithError(error));
  }
};

// admin: recheck cic for loan application
exports.recheckCIC = async (req, res) => {
  try {
    const loanApplicationId = req.params.id;

    // only admin can recheck
    if (req.user.role !== "admin") {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_PERMISSION_DENIED,
          "Chỉ admin mới có quyền kiểm tra lại CIC"
        )
      );
    }

    const loanApplication = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
      include: [
        { model: models.borrower_information },
        { model: models.users, attributes: ["id", "full_name"] },
      ],
    });

    if (!loanApplication) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
          "Yêu cầu vay không tồn tại"
        )
      );
    }

    const borrowerInfo = loanApplication.borrower_information;
    const user = loanApplication.user;

    // only check cic (steps 6-7)
    const cicResult = await complianceService.checkCIC({
      cccd: borrowerInfo?.cccd || borrowerInfo?.id_card,
      msdn: borrowerInfo?.business_registration_number,
      customerName: user?.full_name || borrowerInfo?.full_name,
      customerType: borrowerInfo?.customer_type || 1,
      loanApplicationId: loanApplication.id,
      userId: loanApplication.user_id,
    });

    // update result
    await models.loan_application.update(
      {
        cic_checked: 1,
        cic_check_date: new Date(),
        cic_transaction_code: cicResult.transactionCode,
        cic_total_debt: cicResult.details?.totalDebtP2P || 0,
        cic_has_bad_debt: cicResult.passed ? 0 : 1,
        updated_date: new Date(),
      },
      { where: { id: loanApplicationId } }
    );

    res.json(
      responseSuccess({
        loanApplicationId,
        cicResult: {
          passed: cicResult.passed,
          status: cicResult.status,
          reason: cicResult.reason,
          transactionCode: cicResult.transactionCode,
          details: cicResult.details,
        },
      })
    );
  } catch (error) {
    logger.error("recheckCIC error:", error);
    res.json(responseWithError(error));
  }
};
