// repayment controller - handles repayment api endpoints

const {
  responseSuccess,
  responseWithError,
} = require("../../helper/messageResponse");
const { ErrorCodes } = require("../../helper/constants");
const repaymentService = require("./repaymentService");
const appotapayService = require("../appotapay/appotapayService");
const notiService = require("../notifications/notiService");
const { notiFcm } = require("../../helper/fcm");
const models = require("../../../models");
const logger = require("../../../winston");
const { host } = require("../../../config/config.json");

// get user's repayment schedule
exports.getMySchedule = async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const schedules = await repaymentService.getByUser(req.user.id, {
      status,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });
    res.json(responseSuccess(schedules, "Lịch trả nợ của bạn"));
  } catch (err) {
    logger.error("getMySchedule error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// get repayment schedule by loan application
exports.getByLoanApplication = async (req, res) => {
  try {
    const { loanApplicationId } = req.params;

    // check access permission
    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
    });

    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    // user can only view their own, admin/investor can view all
    if (req.user.role === 1 && loan.user_id !== req.user.id) {
      return res.json(
        responseWithError(ErrorCodes.NOT_ALLOWED, "Không có quyền truy cập")
      );
    }

    const schedules = await repaymentService.getByLoanApplication(
      loanApplicationId
    );
    const remainingDebt = await repaymentService.getRemainingDebt(
      loanApplicationId
    );

    res.json(
      responseSuccess(
        { schedules, remainingDebt, totalPeriods: schedules.length },
        "Lịch trả nợ"
      )
    );
  } catch (err) {
    logger.error("getByLoanApplication error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// pay a single period
exports.payPeriod = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { amount, paymentMethod, bankCode, returnUrl } = req.body;

    const schedule = await models.repayment_schedule.findOne({
      where: { id: scheduleId, user_id: req.user.id, deleted: 0 },
      include: [
        {
          model: models.loan_application,
          attributes: ["id", "code_transaction"],
        },
      ],
    });

    if (!schedule) {
      return res.json(
        responseWithError(
          ErrorCodes.ITEM_NOT_EXIST,
          "Không tìm thấy lịch trả nợ"
        )
      );
    }

    if (schedule.status === "PAID") {
      return res.json(
        responseWithError(ErrorCodes.BAD_REQUEST, "Kỳ này đã được thanh toán")
      );
    }

    const payAmount = amount || schedule.remaining_amount;

    // create payment via appotapay
    const result = await appotapayService.createPaymentOrder({
      userId: req.user.id,
      loanApplicationId: schedule.loan_application_id,
      amount: payAmount,
      paymentMethod,
      bankCode,
      description: `Thanh toan ky ${schedule.period_number} - ${schedule.loan_application.code_transaction}`,
      returnUrl,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Tạo thanh toán thất bại"
        )
      );
    }

    // save transaction
    await appotapayService.saveTransaction({
      userId: req.user.id,
      loanApplicationId: schedule.loan_application_id,
      transactionId: result.transactionId,
      amount: payAmount,
      paymentMethod,
      bankCode,
      transactionType: "REPAYMENT",
      status: "PENDING",
      paymentUrl: result.data?.payUrl,
    });

    res.json(
      responseSuccess(
        {
          transactionId: result.transactionId,
          paymentUrl: result.data?.paymentUrl || result.data?.payUrl,
          qrCode: result.data?.qrCode,
          amount: payAmount,
          scheduleId,
        },
        "Tạo thanh toán thành công"
      )
    );
  } catch (err) {
    logger.error("payPeriod error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// full settlement of loan
exports.settlement = async (req, res) => {
  try {
    const { loanApplicationId } = req.params;
    const { paymentMethod, bankCode, returnUrl } = req.body;

    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, user_id: req.user.id, deleted: 0 },
    });

    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    if (loan.status === 5) {
      return res.json(
        responseWithError(ErrorCodes.BAD_REQUEST, "Khoản vay đã được tất toán")
      );
    }

    // calculate total remaining debt
    const remainingDebt = await repaymentService.getRemainingDebt(
      loanApplicationId
    );

    if (remainingDebt <= 0) {
      // already paid off, just update status
      await models.loan_application.update(
        { status: 5, is_pay: 2, updated_date: new Date() },
        { where: { id: loanApplicationId } }
      );
      return res.json(
        responseSuccess({ message: "Khoản vay đã được tất toán" })
      );
    }

    // create settlement payment
    const result = await appotapayService.createPaymentOrder({
      userId: req.user.id,
      loanApplicationId,
      amount: remainingDebt,
      paymentMethod,
      bankCode,
      description: `Tat toan khoan vay ${loan.code_transaction}`,
      returnUrl,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Tạo thanh toán thất bại"
        )
      );
    }

    await appotapayService.saveTransaction({
      userId: req.user.id,
      loanApplicationId,
      transactionId: result.transactionId,
      amount: remainingDebt,
      paymentMethod,
      bankCode,
      transactionType: "SETTLEMENT",
      status: "PENDING",
      paymentUrl: result.data?.payUrl,
    });

    res.json(
      responseSuccess(
        {
          transactionId: result.transactionId,
          paymentUrl: result.data?.paymentUrl || result.data?.payUrl,
          qrCode: result.data?.qrCode,
          totalAmount: remainingDebt,
        },
        "Tạo yêu cầu tất toán thành công"
      )
    );
  } catch (err) {
    logger.error("settlement error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// get next due period
exports.getNextDue = async (req, res) => {
  try {
    const { loanApplicationId } = req.params;

    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, user_id: req.user.id, deleted: 0 },
    });

    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    const nextDue = await repaymentService.getNextDue(loanApplicationId);
    const remainingDebt = await repaymentService.getRemainingDebt(
      loanApplicationId
    );

    res.json(
      responseSuccess({ nextDue, remainingDebt }, "Kỳ thanh toán tiếp theo")
    );
  } catch (err) {
    logger.error("getNextDue error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: get upcoming due list
exports.getUpcomingDue = async (req, res) => {
  try {
    const { days } = req.query;
    const schedules = await repaymentService.getUpcomingDue(
      parseInt(days) || 7
    );
    res.json(responseSuccess(schedules, "Danh sách sắp đến hạn"));
  } catch (err) {
    logger.error("getUpcomingDue error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: get overdue list
exports.getOverdue = async (req, res) => {
  try {
    const schedules = await repaymentService.getOverdue();
    res.json(responseSuccess(schedules, "Danh sách quá hạn"));
  } catch (err) {
    logger.error("getOverdue error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};
