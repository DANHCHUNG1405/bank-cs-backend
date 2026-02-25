// cic controller - handles cic api requests

const cicService = require("./cicService");
const models = require("../../../models");
const logger = require("../../../winston");
const { ErrorCodes } = require("../../helper/constants");
const {
  responseWithError,
  responseSuccess,
} = require("../../helper/messageResponse");

// check credit before loan approval - required by nhnn 2970
exports.checkCredit = async (req, res) => {
  try {
    const { cccd, customerName, birthDate, loanApplicationId } = req.body;

    // Validate CCCD
    if (!cccd) {
      return res.json(
        responseWithError(ErrorCodes.INVALID_PARAMETER, "CCCD là bắt buộc")
      );
    }

    if (cccd.length !== 12) {
      return res.json(
        responseWithError(ErrorCodes.INVALID_PARAMETER, "CCCD phải có 12 số")
      );
    }

    if (!customerName) {
      return res.json(
        responseWithError(ErrorCodes.INVALID_PARAMETER, "Họ tên là bắt buộc")
      );
    }

    // Kiểm tra loan application nếu có
    let loan = null;
    if (loanApplicationId) {
      loan = await models.loan_application.findOne({
        where: { id: loanApplicationId, deleted: 0 },
      });
      if (!loan) {
        return res.json(
          responseWithError(
            ErrorCodes.ITEM_NOT_EXIST,
            "Không tìm thấy khoản vay"
          )
        );
      }
    }

    // Gọi CIC API
    const result = await cicService.checkCredit({
      cccd,
      customerName,
      birthDate,
      loanApplicationId,
      userId: req.user?.id,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Kiểm tra CIC thất bại"
        )
      );
    }

    // Cập nhật loan application nếu có
    if (loan && result.data) {
      await models.loan_application.update(
        {
          cic_checked: 1,
          cic_check_date: new Date(),
          cic_transaction_code: result.transactionCode,
          cic_total_debt: result.data.totalDebt,
          cic_has_bad_debt: result.data.hasBadDebt ? 1 : 0,
          cic_credit_score: result.data.creditScore,
          cic_credit_grade: result.data.creditGrade,
          updated_date: new Date(),
        },
        { where: { id: loanApplicationId } }
      );
    }

    res.json(
      responseSuccess(
        {
          transactionCode: result.transactionCode,
          ...result.data,
        },
        "Kiểm tra CIC thành công"
      )
    );
  } catch (error) {
    logger.error("checkCredit error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// lookup check result
exports.lookupCheck = async (req, res) => {
  try {
    const { transactionCode } = req.params;

    // Kiểm tra local DB trước
    const localResult = await cicService.getReportByTransactionCode(
      transactionCode
    );
    if (localResult.success && localResult.data) {
      return res.json(responseSuccess(localResult.data, "Kết quả kiểm tra"));
    }

    // Nếu không có, gọi CIC API
    const result = await cicService.lookupCheck(transactionCode);
    if (!result.success) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy kết quả")
      );
    }

    res.json(responseSuccess(result.data, "Kết quả kiểm tra"));
  } catch (error) {
    logger.error("lookupCheck error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// instant report after disbursement - new loan
exports.reportNewLoan = async (req, res) => {
  try {
    const { loanApplicationId } = req.body;

    if (!loanApplicationId) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "loanApplicationId là bắt buộc"
        )
      );
    }

    // Lấy thông tin khoản vay
    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
      include: [
        {
          model: models.users,
          attributes: [
            "id",
            "full_name",
            "cccd",
            "birthday",
            "gender",
            "phone",
          ],
        },
        { model: models.borrower_information },
      ],
    });

    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    // Chuẩn bị dữ liệu báo cáo
    const reportData = {
      loanApplicationId: loan.id,
      userId: loan.user_id,
      cccd: loan.user?.cccd,
      customerName: loan.user?.full_name,
      birthDate: loan.user?.birthday,
      phone: loan.user?.phone,
      gender: loan.user?.gender,
      loanAmount: loan.loan_amount,
    };

    const result = await cicService.reportNewLoan(reportData);

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Báo cáo CIC thất bại"
        )
      );
    }

    // Cập nhật trạng thái đã báo cáo
    await models.loan_application.update(
      {
        cic_reported: 1,
        cic_report_date: new Date(),
        cic_report_transaction_code: result.transactionCode,
        updated_date: new Date(),
      },
      { where: { id: loanApplicationId } }
    );

    res.json(
      responseSuccess(
        {
          transactionCode: result.transactionCode,
          receivedAt: result.receivedAt,
          warnings: result.warnings || [],
          cicViolation: result.cicViolation,
        },
        result.cicViolation
          ? "Báo cáo thành công nhưng có cảnh báo vi phạm không kiểm tra CIC"
          : "Báo cáo CIC thành công"
      )
    );
  } catch (error) {
    logger.error("reportNewLoan error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// instant report - existing loan changes (payment, extension, settlement)
exports.reportOldLoan = async (req, res) => {
  try {
    const { loanApplicationId, changeType, outstandingBalance } = req.body;

    if (!loanApplicationId || !changeType) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "loanApplicationId và changeType là bắt buộc"
        )
      );
    }

    if (!["THANHTOAN", "GIAHAN", "TATTOAN"].includes(changeType)) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "changeType phải là THANHTOAN, GIAHAN hoặc TATTOAN"
        )
      );
    }

    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
      include: [
        {
          model: models.users,
          attributes: [
            "id",
            "full_name",
            "cccd",
            "birthday",
            "gender",
            "phone",
          ],
        },
      ],
    });

    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    if (!loan.cic_report_transaction_code) {
      return res.json(
        responseWithError(
          ErrorCodes.BAD_REQUEST,
          "Khoản vay chưa được báo cáo lần đầu"
        )
      );
    }

    const result = await cicService.reportOldLoan({
      loanApplicationId: loan.id,
      userId: loan.user_id,
      cccd: loan.user?.cccd,
      customerName: loan.user?.full_name,
      birthDate: loan.user?.birthday,
      phone: loan.user?.phone,
      gender: loan.user?.gender,
      outstandingBalance: outstandingBalance ?? loan.outstanding_principal ?? 0,
      originalTransactionCode: loan.cic_report_transaction_code,
      changeType,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Báo cáo CIC thất bại"
        )
      );
    }

    res.json(
      responseSuccess(
        { receivedAt: result.receivedAt },
        "Báo cáo biến động khoản vay thành công"
      )
    );
  } catch (error) {
    logger.error("reportOldLoan error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// periodic report d1/d2 - usually called by cron
exports.reportPeriodic = async (req, res) => {
  try {
    const { type, reportDate } = req.body;

    if (!type || !["DAILY", "MONTHLY"].includes(type)) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "type phải là DAILY hoặc MONTHLY"
        )
      );
    }

    const date = reportDate ? new Date(reportDate) : new Date();

    // Lấy danh sách hợp đồng cần báo cáo
    let contracts;
    if (type === "DAILY") {
      contracts = await getDailyContracts(date);
    } else {
      contracts = await getMonthlyContracts(date);
    }

    if (!contracts || contracts.length === 0) {
      return res.json(
        responseSuccess(
          { message: "Không có hợp đồng cần báo cáo" },
          "Hoàn thành"
        )
      );
    }

    const result = await cicService.reportPeriodic(type, date, contracts);

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Báo cáo định kỳ thất bại"
        )
      );
    }

    res.json(
      responseSuccess(
        {
          fileName: result.fileName,
          totalTransactions: result.totalTransactions,
          successCount: result.successCount,
          failedCount: result.failedCount,
          errors: result.errors,
        },
        "Báo cáo định kỳ thành công"
      )
    );
  } catch (error) {
    logger.error("reportPeriodic error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// get contracts for d1 daily report
const getDailyContracts = async (date) => {
  const { Op } = require("sequelize");
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const loans = await models.loan_application.findAll({
    where: {
      deleted: 0,
      [Op.or]: [
        { disbursement_date: { [Op.between]: [startOfDay, endOfDay] } },
        {
          updated_date: { [Op.between]: [startOfDay, endOfDay] },
          status: { [Op.in]: [3, 4, 5] }, // Đang trả nợ, hoàn thành, quá hạn
        },
      ],
    },
    include: [
      {
        model: models.users,
        attributes: ["id", "full_name", "cccd", "birthday", "gender", "phone"],
      },
    ],
  });

  return loans.map((loan) => ({
    transactionCode: loan.cic_report_transaction_code,
    cccd: loan.user?.cccd,
    customerName: loan.user?.full_name,
    birthDate: loan.user?.birthday,
    phone: loan.user?.phone,
    gender: loan.user?.gender,
    loanAmount: loan.loan_amount,
    outstandingBalance: loan.outstanding_principal || loan.loan_amount,
  }));
};

// get contracts for d2 monthly report
const getMonthlyContracts = async () => {
  const { Op } = require("sequelize");

  const loans = await models.loan_application.findAll({
    where: {
      deleted: 0,
      status: { [Op.in]: [3, 4] }, // Đang trả nợ
      outstanding_principal: { [Op.gt]: 0 },
    },
    include: [
      {
        model: models.users,
        attributes: ["id", "full_name", "cccd", "birthday", "gender", "phone"],
      },
    ],
  });

  return loans.map((loan) => ({
    transactionCode: loan.cic_report_transaction_code,
    cccd: loan.user?.cccd,
    customerName: loan.user?.full_name,
    birthDate: loan.user?.birthday,
    phone: loan.user?.phone,
    gender: loan.user?.gender,
    loanAmount: loan.loan_amount,
    outstandingBalance: loan.outstanding_principal,
  }));
};

// check statistics
exports.statisticsCheck = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "fromDate và toDate là bắt buộc"
        )
      );
    }

    const result = await cicService.statisticsCheck(
      new Date(fromDate),
      new Date(toDate)
    );

    if (!result.success) {
      return res.json(
        responseWithError(ErrorCodes.SYSTEM_ERROR, result.error?.message)
      );
    }

    res.json(responseSuccess(result.data, "Thống kê kiểm tra"));
  } catch (error) {
    logger.error("statisticsCheck error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// instant report statistics
exports.statisticsInstant = async (req, res) => {
  try {
    const { fromDate, toDate, status } = req.query;

    if (!fromDate || !toDate) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "fromDate và toDate là bắt buộc"
        )
      );
    }

    const result = await cicService.statisticsInstantReports(
      new Date(fromDate),
      new Date(toDate),
      status ? parseInt(status) : null
    );

    if (!result.success) {
      return res.json(
        responseWithError(ErrorCodes.SYSTEM_ERROR, result.error?.message)
      );
    }

    res.json(responseSuccess(result.data, "Thống kê báo cáo tức thời"));
  } catch (error) {
    logger.error("statisticsInstant error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// periodic report statistics
exports.statisticsPeriodic = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "fromDate và toDate là bắt buộc"
        )
      );
    }

    const result = await cicService.statisticsPeriodicReports(
      new Date(fromDate),
      new Date(toDate)
    );

    if (!result.success) {
      return res.json(
        responseWithError(ErrorCodes.SYSTEM_ERROR, result.error?.message)
      );
    }

    res.json(responseSuccess(result.data, "Thống kê báo cáo định kỳ"));
  } catch (error) {
    logger.error("statisticsPeriodic error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// lookup periodic report by filename
exports.lookupPeriodicReport = async (req, res) => {
  try {
    const { fileName } = req.params;

    const result = await cicService.lookupPeriodicReport(fileName);

    if (!result.success) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy báo cáo")
      );
    }

    res.json(responseSuccess(result.data, "Chi tiết báo cáo"));
  } catch (error) {
    logger.error("lookupPeriodicReport error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// get reports list
exports.getReports = async (req, res) => {
  try {
    const { loanApplicationId, type, status, page, limit } = req.query;
    const { Op } = require("sequelize");

    const where = { deleted: 0 };
    if (loanApplicationId) where.loan_application_id = loanApplicationId;
    if (type) where.report_type = type;
    if (status) where.processing_status = status;

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;

    const { count, rows } = await models.cic_report.findAndCountAll({
      where,
      order: [["created_date", "DESC"]],
      limit: pageSize,
      offset: (pageNum - 1) * pageSize,
    });

    res.json(
      responseSuccess(
        {
          total: count,
          page: pageNum,
          limit: pageSize,
          data: rows,
        },
        "Danh sách báo cáo CIC"
      )
    );
  } catch (error) {
    logger.error("getReports error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// retry failed report
exports.retryReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await models.cic_report.findOne({
      where: { id: reportId, deleted: 0 },
    });

    if (!report) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy báo cáo")
      );
    }

    if (report.processing_status !== "FAILED") {
      return res.json(
        responseWithError(
          ErrorCodes.BAD_REQUEST,
          "Chỉ có thể retry báo cáo thất bại"
        )
      );
    }

    if (report.retry_count >= 3) {
      return res.json(
        responseWithError(
          ErrorCodes.BAD_REQUEST,
          "Đã vượt quá số lần retry tối đa"
        )
      );
    }

    // Cập nhật retry count
    await cicService.updateRetryCount(reportId);

    // Retry dựa trên loại báo cáo
    let result;
    if (report.report_type === cicService.REPORT_TYPES.INSTANT_NEW) {
      const loan = await models.loan_application.findOne({
        where: { id: report.loan_application_id },
        include: [{ model: models.users }],
      });

      if (loan) {
        result = await cicService.reportNewLoan({
          loanApplicationId: loan.id,
          userId: loan.user_id,
          cccd: loan.user?.cccd,
          customerName: loan.user?.full_name,
          birthDate: loan.user?.birthday,
          phone: loan.user?.phone,
          gender: loan.user?.gender,
          loanAmount: loan.loan_amount,
        });
      }
    }

    if (result?.success) {
      res.json(
        responseSuccess(
          { newTransactionCode: result.transactionCode },
          "Retry thành công"
        )
      );
    } else {
      res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result?.error?.message || "Retry thất bại"
        )
      );
    }
  } catch (error) {
    logger.error("retryReport error:", error);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};
