// disbursement service - handles loan disbursement flow
// integrates with appotapay for bank transfers and cic for instant reports

const models = require("../../../models");
const { Op } = require("sequelize");
const logger = require("../../../winston");
const appotapayService = require("../appotapay/appotapayService");
const repaymentService = require("../repayment/repaymentService");
const notiService = require("../notifications/notiService");
const { notiFcm } = require("../../helper/fcm");
const { host } = require("../../../config/config.json");
const cicService = require("../cic/cicService");

// create disbursement request when investor accepts loan
exports.createDisbursement = async (data) => {
  try {
    const loan = await models.loan_application.findOne({
      where: { id: data.loanApplicationId, deleted: 0 },
      include: [
        { model: models.loan_information },
        { model: models.borrower_information },
        {
          model: models.users,
          attributes: ["id", "full_name", "phone", "email"],
        },
      ],
    });

    if (!loan) {
      return { success: false, message: "Không tìm thấy khoản vay" };
    }

    // auto confirm date is 7 days from now
    const autoConfirmDate = new Date();
    autoConfirmDate.setDate(autoConfirmDate.getDate() + 7);

    const disbursement = await models.disbursement.create({
      loan_application_id: data.loanApplicationId,
      investor_id: data.investorId,
      borrower_id: loan.user_id,
      amount: loan.loan_information.loan_amount,
      dest_bank_code: loan.borrower_information?.bank_id,
      dest_account_no: loan.borrower_information?.bank_account_number,
      dest_account_name: loan.borrower_information?.account_name,
      status: "PENDING",
      auto_confirm_date: autoConfirmDate,
      created_by: data.investorId.toString(),
    });

    return { success: true, data: disbursement };
  } catch (err) {
    logger.error("createDisbursement error:", err);
    return { success: false, error: err.message };
  }
};

// investor confirms they transferred money to system
exports.investorTransfer = async (disbursementId, data) => {
  try {
    const disbursement = await models.disbursement.findOne({
      where: { id: disbursementId, deleted: 0 },
    });

    if (!disbursement) {
      return { success: false, message: "Không tìm thấy yêu cầu giải ngân" };
    }

    await models.disbursement.update(
      {
        status: "INVESTOR_TRANSFERRED",
        investor_transaction_id: data.transactionId,
        investor_transfer_date: new Date(),
        investor_transfer_proof: data.proofImage,
        source_bank_code: data.bankCode,
        source_account_no: data.accountNo,
        source_account_name: data.accountName,
        updated_date: new Date(),
      },
      { where: { id: disbursementId } }
    );

    return { success: true, message: "Đã ghi nhận chuyển tiền từ nhà đầu tư" };
  } catch (err) {
    logger.error("investorTransfer error:", err);
    return { success: false, error: err.message };
  }
};

// system transfers money to borrower via appotapay
exports.transferToBorrower = async (disbursementId) => {
  try {
    const disbursement = await models.disbursement.findOne({
      where: { id: disbursementId, deleted: 0 },
      include: [
        {
          model: models.loan_application,
          include: [{ model: models.users, attributes: ["id", "full_name"] }],
        },
      ],
    });

    if (!disbursement) {
      return { success: false, message: "Không tìm thấy yêu cầu giải ngân" };
    }

    if (!disbursement.dest_account_no || !disbursement.dest_bank_code) {
      return { success: false, message: "Thiếu thông tin tài khoản người vay" };
    }

    // call appotapay to transfer with account verification and auto retry
    const result = await appotapayService.createDisbursementWithRetry({
      amount: disbursement.amount,
      bankCode: disbursement.dest_bank_code,
      accountNo: disbursement.dest_account_no,
      accountName: disbursement.dest_account_name,
      content: `Giai ngan khoan vay ${disbursement.loan_application_id}`,
      verifyAccount: true, // Xác thực tài khoản trước khi chuyển
    });

    if (!result.success) {
      await models.disbursement.update(
        {
          status: "FAILED",
          error_code: result.error?.code || result.errorType,
          error_message: result.error?.message,
          retry_count: result.retryCount || 0,
          updated_date: new Date(),
        },
        { where: { id: disbursementId } }
      );

      // classify error for proper handling
      const errorResponse = {
        success: false,
        message: result.error?.message || "Chuyển tiền thất bại",
        errorType: result.errorType,
        needUserAction: result.needUserAction,
        retryCount: result.retryCount,
      };

      if (result.needUserAction) {
        errorResponse.suggestion =
          "Vui lòng kiểm tra lại thông tin tài khoản ngân hàng của người vay";
      }

      return errorResponse;
    }

    await models.disbursement.update(
      {
        status: "TRANSFERRED_TO_BORROWER",
        borrower_transaction_id: result.transactionId,
        borrower_transfer_date: new Date(),
        updated_date: new Date(),
      },
      { where: { id: disbursementId } }
    );

    // send notification to borrower
    const payload = {
      title: "Thông báo giải ngân",
      body: `Khoản vay của bạn đã được giải ngân ${disbursement.amount.toLocaleString()}đ. Vui lòng kiểm tra và xác nhận.`,
      name: "Thông báo giải ngân",
      content: `Khoản vay của bạn đã được giải ngân ${disbursement.amount.toLocaleString()}đ. Vui lòng kiểm tra và xác nhận.`,
      type_id: disbursement.loan_application_id.toString(),
      type: "4",
      deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${disbursement.loan_application_id}`,
      user_id: disbursement.borrower_id.toString(),
    };
    const noti = await notiService.create(payload);
    notiFcm(disbursement.borrower_id, payload, noti.id);

    return { success: true, transactionId: result.transactionId };
  } catch (err) {
    logger.error("transferToBorrower error:", err);
    return { success: false, error: err.message };
  }
};

// borrower confirms they received money
exports.borrowerConfirm = async (disbursementId, userId, data) => {
  try {
    const disbursement = await models.disbursement.findOne({
      where: { id: disbursementId, borrower_id: userId, deleted: 0 },
    });

    if (!disbursement) {
      return { success: false, message: "Không tìm thấy yêu cầu giải ngân" };
    }

    if (disbursement.status !== "TRANSFERRED_TO_BORROWER") {
      return { success: false, message: "Trạng thái không hợp lệ để xác nhận" };
    }

    await models.disbursement.update(
      {
        status: "BORROWER_CONFIRMED",
        borrower_confirmed: 1,
        borrower_confirmed_date: new Date(),
        borrower_confirmed_amount: data.confirmedAmount || disbursement.amount,
        updated_date: new Date(),
      },
      { where: { id: disbursementId } }
    );

    // complete disbursement process
    await this.completeDisbursement(disbursementId);

    return { success: true, message: "Xác nhận nhận tiền thành công" };
  } catch (err) {
    logger.error("borrowerConfirm error:", err);
    return { success: false, error: err.message };
  }
};

// complete disbursement and create repayment schedule
// integrates cic instant report per nhnn decision 2970
exports.completeDisbursement = async (disbursementId) => {
  try {
    const disbursement = await models.disbursement.findOne({
      where: { id: disbursementId, deleted: 0 },
      include: [
        {
          model: models.loan_application,
          include: [
            { model: models.loan_information },
            { model: models.borrower_information },
            {
              model: models.users,
              attributes: ["id", "full_name", "phone", "email"],
            },
          ],
        },
      ],
    });

    if (!disbursement) {
      return { success: false, message: "Không tìm thấy yêu cầu giải ngân" };
    }

    const loan = disbursement.loan_application;
    const loanInfo = loan?.loan_information;
    const borrowerInfo = loan?.borrower_information;
    const user = loan?.user;

    await models.disbursement.update(
      { status: "COMPLETED", updated_date: new Date() },
      { where: { id: disbursementId } }
    );

    // update loan status
    await models.loan_application.update(
      {
        status: 4,
        is_pay: 1,
        disbursement_date: new Date(),
        updated_date: new Date(),
      },
      { where: { id: disbursement.loan_application_id } }
    );

    // create repayment schedule
    await repaymentService.createRepaymentSchedule(
      disbursement.loan_application_id
    );

    // CIC instant report after disbursement (QĐ 2970/QĐ-NHNN)
    // Báo cáo tức thời khoản vay mới ngay sau giải ngân
    try {
      const cicReportData = {
        loanApplicationId: loan.id,
        userId: loan.user_id,
        cccd: borrowerInfo?.citizen_identification || borrowerInfo?.cccd,
        customerName: user?.full_name || borrowerInfo?.full_name,
        birthDate: user?.birthday,
        phone: user?.phone,
        gender: user?.gender || 1,
        loanAmount: loanInfo?.loan_amount || disbursement.amount,
      };

      const cicResult = await cicService.reportNewLoan(cicReportData);

      if (cicResult.success) {
        logger.info(
          `CIC instant report SUCCESS for loan ${loan.id}, txCode: ${cicResult.transactionCode}`
        );

        // Cập nhật trạng thái đã báo cáo CIC
        await models.loan_application.update(
          {
            cic_reported: 1,
            cic_report_date: new Date(),
            cic_report_transaction_code: cicResult.transactionCode,
          },
          { where: { id: loan.id } }
        );

        // Kiểm tra cảnh báo vi phạm không kiểm tra CIC trước khi cho vay
        if (cicResult.cicViolation) {
          logger.warn(
            `CIC VIOLATION WARNING for loan ${loan.id}: Không kiểm tra CIC trước khi cho vay`
          );
        }
      } else {
        logger.error(
          `CIC instant report FAILED for loan ${loan.id}:`,
          cicResult.error
        );
        // Lưu để retry sau (không block giải ngân)
      }
    } catch (cicError) {
      logger.error(
        `CIC report error for loan ${disbursement.loan_application_id}:`,
        cicError
      );
      // Không throw - giải ngân vẫn thành công, CIC sẽ retry sau
    }

    // send notification to investor
    const payload = {
      title: "Giải ngân hoàn thành",
      body: `Khoản vay #${disbursement.loan_application_id} đã được giải ngân thành công.`,
      name: "Giải ngân hoàn thành",
      content: `Khoản vay #${disbursement.loan_application_id} đã được giải ngân thành công.`,
      type_id: disbursement.loan_application_id.toString(),
      type: "4",
      user_id: disbursement.investor_id.toString(),
    };
    const noti = await notiService.create(payload);
    notiFcm(disbursement.investor_id, payload, noti.id);

    return { success: true };
  } catch (err) {
    logger.error("completeDisbursement error:", err);
    return { success: false, error: err.message };
  }
};

// auto confirm after 7 days if no complaint
exports.autoConfirmExpired = async () => {
  try {
    const expiredDisbursements = await models.disbursement.findAll({
      where: {
        status: "TRANSFERRED_TO_BORROWER",
        auto_confirm_date: { [Op.lte]: new Date() },
        deleted: 0,
      },
    });

    for (const d of expiredDisbursements) {
      // check if there's any pending complaint
      const hasComplaint = await models.complaint.findOne({
        where: {
          loan_application_id: d.loan_application_id,
          status: { [Op.notIn]: ["RESOLVED", "REJECTED"] },
          deleted: 0,
        },
      });

      if (!hasComplaint) {
        await models.disbursement.update(
          {
            status: "BORROWER_CONFIRMED",
            borrower_confirmed: 1,
            borrower_confirmed_date: new Date(),
            borrower_confirmed_amount: d.amount,
            updated_date: new Date(),
          },
          { where: { id: d.id } }
        );
        await this.completeDisbursement(d.id);
        logger.info(`Auto confirmed disbursement ${d.id}`);
      }
    }

    return { success: true, count: expiredDisbursements.length };
  } catch (err) {
    logger.error("autoConfirmExpired error:", err);
    return { success: false, error: err.message };
  }
};

// get disbursement by loan application id
exports.getByLoanApplication = async (loanApplicationId) => {
  return models.disbursement.findOne({
    where: { loan_application_id: loanApplicationId, deleted: 0 },
  });
};

// get disbursements by investor id
exports.getByInvestor = async (investorId, options = {}) => {
  const where = { investor_id: investorId, deleted: 0 };
  if (options.status) where.status = options.status;

  return models.disbursement.findAll({
    where,
    include: [
      {
        model: models.loan_application,
        attributes: ["id", "code_transaction"],
        include: [{ model: models.users, attributes: ["id", "full_name"] }],
      },
    ],
    order: [["created_date", "DESC"]],
    limit: options.limit || 20,
    offset: options.offset || 0,
  });
};
