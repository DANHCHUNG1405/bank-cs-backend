// appotapay controller - handles payment api endpoints

const appotapayService = require("./appotapayService");
const models = require("../../../models");
const logger = require("../../../winston");
const { ErrorCodes } = require("../../helper/constants");
const {
  responseWithError,
  responseSuccess,
} = require("../../helper/messageResponse");

// status mapping from appotapay codes
const STATUS_MAP = {
  0: "SUCCESS",
  1: "PENDING",
  2: "PROCESSING",
  "-1": "FAILED",
  "-2": "CANCELLED",
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};
// map appotapay status to our status
const mapStatus = (s) => STATUS_MAP[s] || "PENDING";

// save transaction async (non-blocking)
const saveTransactionAsync = (data) => {
  appotapayService
    .saveTransaction(data)
    .catch((e) => logger.warn("save tx failed:", e.message));
};

// update related records when payment succeeds
const onPaymentSuccess = async (tx) => {
  if (tx?.payment_id)
    await models.payment
      .update({ payment_status: 1 }, { where: { id: tx.payment_id } })
      .catch(() => {});
  if (tx?.order_id)
    await models.order
      .update(
        { status: 3, updated_date: new Date() },
        { where: { id: tx.order_id } }
      )
      .catch(() => {});

  // handle repayment or settlement
  if (tx?.loan_application_id && tx?.transaction_type) {
    const repaymentService =
      require("./repaymentService") || require("../repayment/repaymentService");

    if (tx.transaction_type === "REPAYMENT") {
      // find nearest pending repayment schedule
      const schedule = await models.repayment_schedule.findOne({
        where: {
          loan_application_id: tx.loan_application_id,
          status: {
            [require("sequelize").Op.in]: ["PENDING", "PARTIAL", "OVERDUE"],
          },
          deleted: 0,
        },
        order: [["period_number", "ASC"]],
      });

      if (schedule) {
        await repaymentService.updatePayment(schedule.id, {
          amount: tx.amount,
          transactionId: tx.transaction_id,
        });
        logger.info(
          `Updated repayment schedule ${schedule.id} with payment ${tx.transaction_id}`
        );
      }
    } else if (tx.transaction_type === "SETTLEMENT") {
      // settlement - mark all remaining periods as paid
      await models.repayment_schedule.update(
        {
          status: "PAID",
          paid_date: new Date(),
          transaction_id: tx.transaction_id,
          updated_date: new Date(),
        },
        {
          where: {
            loan_application_id: tx.loan_application_id,
            status: {
              [require("sequelize").Op.in]: ["PENDING", "PARTIAL", "OVERDUE"],
            },
          },
        }
      );

      // update loan status to settled
      await models.loan_application.update(
        { status: 5, is_pay: 2, updated_date: new Date() },
        { where: { id: tx.loan_application_id } }
      );

      logger.info(`Settlement completed for loan ${tx.loan_application_id}`);

      // send settlement notification
      const loan = await models.loan_application.findOne({
        where: { id: tx.loan_application_id },
      });
      if (loan) {
        const notiService = require("../notifications/notiService");
        const { notiFcm } = require("../../helper/fcm");
        const { host } = require("../../../config/config.json");

        const payload = {
          title: "Tất toán thành công",
          body: `Khoản vay ${loan.code_transaction} đã được tất toán thành công.`,
          name: "Tất toán thành công",
          content: `Khoản vay ${loan.code_transaction} đã được tất toán thành công.`,
          type_id: loan.id.toString(),
          type: "5",
          deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${loan.id}`,
          user_id: loan.user_id.toString(),
        };
        const noti = await notiService.create(payload);
        notiFcm(loan.user_id, payload, noti.id);
      }
    }
  }
};

// POST /appotapay/payment - create payment order
exports.createPayment = async (req, res) => {
  try {
    const {
      paymentId,
      loanApplicationId,
      orderId,
      amount,
      paymentMethod,
      bankCode,
      description,
      returnUrl,
    } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.json(
        responseWithError(ErrorCodes.INVALID_PARAMETER, "invalid amount")
      );
    }

    if (paymentId) {
      const p = await models.payment.findOne({
        where: { id: paymentId, user_id: userId, deleted: 0 },
      });
      if (!p)
        return res.json(
          responseWithError(ErrorCodes.ITEM_NOT_EXIST, "payment not found")
        );
    }
    if (orderId) {
      const o = await models.order.findOne({
        where: { id: orderId, user_id: userId, deleted: 0 },
      });
      if (!o)
        return res.json(
          responseWithError(ErrorCodes.ITEM_NOT_EXIST, "order not found")
        );
    }

    const result = await appotapayService.createPaymentOrder({
      userId,
      paymentId,
      loanApplicationId,
      orderId,
      amount,
      paymentMethod,
      bankCode,
      description,
      returnUrl,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "payment failed"
        )
      );
    }

    saveTransactionAsync({
      userId,
      paymentId,
      loanApplicationId,
      orderId,
      transactionId: result.transactionId,
      appotapayTransactionId: result.data?.appotapayOrderId,
      amount,
      paymentMethod,
      bankCode,
      transactionType: "REPAYMENT",
      status: "PENDING",
      paymentUrl: result.data?.payUrl,
      expiredAt: result.data?.expireTime,
    });

    res.json(
      responseSuccess(
        {
          transactionId: result.transactionId,
          paymentUrl: result.data?.paymentUrl || result.data?.payUrl,
          qrCode: result.data?.qrCode,
          expireTime: result.data?.expireTime,
        },
        "payment created"
      )
    );
  } catch (err) {
    logger.error("createPayment:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "system error"));
  }
};

// POST /appotapay/qr-payment - create qr payment
exports.createQRPayment = async (req, res) => {
  try {
    const { paymentId, loanApplicationId, orderId, amount, description } =
      req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.json(
        responseWithError(ErrorCodes.INVALID_PARAMETER, "invalid amount")
      );
    }

    const result = await appotapayService.createQRPayment({
      userId,
      paymentId,
      loanApplicationId,
      orderId,
      amount,
      description,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "qr payment failed"
        )
      );
    }

    saveTransactionAsync({
      userId,
      paymentId,
      loanApplicationId,
      orderId,
      transactionId: result.transactionId,
      amount,
      paymentMethod: "QR",
      transactionType: "REPAYMENT",
      status: "PENDING",
      qrCode: result.data?.qrCode,
      expiredAt: result.data?.expireTime,
    });

    res.json(
      responseSuccess(
        {
          transactionId: result.transactionId,
          qrCode: result.data?.qrCode,
          qrCodeUrl: result.data?.qrCodeUrl,
          expireTime: result.data?.expireTime,
        },
        "qr created"
      )
    );
  } catch (err) {
    logger.error("createQRPayment:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "system error"));
  }
};

// POST /appotapay/disbursement - create disbursement (admin only)
exports.createDisbursement = async (req, res) => {
  try {
    const {
      loanApplicationId,
      amount,
      bankCode,
      accountNo,
      accountName,
      content,
    } = req.body;
    const userId = req.user.id;

    if (
      !loanApplicationId ||
      !amount ||
      !bankCode ||
      !accountNo ||
      !accountName
    ) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "missing required fields"
        )
      );
    }

    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
    });
    if (!loan)
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "loan not found")
      );

    const result = await appotapayService.createDisbursement({
      userId,
      loanApplicationId,
      amount,
      bankCode,
      accountNo,
      accountName,
      content,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "disbursement failed"
        )
      );
    }

    await appotapayService.saveTransaction({
      userId,
      loanApplicationId,
      transactionId: result.transactionId,
      appotapayTransactionId: result.data?.transactionId,
      amount,
      paymentMethod: "BANK",
      bankCode,
      transactionType: "DISBURSEMENT",
      status: "PROCESSING",
    });

    res.json(
      responseSuccess(
        { transactionId: result.transactionId, status: "PROCESSING" },
        "disbursement submitted"
      )
    );
  } catch (err) {
    logger.error("createDisbursement:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "system error"));
  }
};

// GET /appotapay/transaction/:transactionId/status - check transaction status
exports.checkStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const local = await appotapayService.getTransactionById(transactionId);
    if (!local.success || !local.data)
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "transaction not found")
      );
    if (local.data.user_id !== userId)
      return res.json(
        responseWithError(ErrorCodes.NOT_ALLOWED, "access denied")
      );

    const remote = await appotapayService.checkTransactionStatus(transactionId);
    if (remote.success && remote.data) {
      const newStatus = mapStatus(remote.data.status);
      if (newStatus !== local.data.status) {
        await appotapayService.updateTransactionStatus(transactionId, {
          status: newStatus,
          appotapayTransactionId: remote.data.transactionId,
          callbackData: remote.data,
        });
      }
      return res.json(
        responseSuccess({
          transactionId,
          status: newStatus,
          amount: local.data.amount,
          paidAt: local.data.paid_at,
        })
      );
    }

    res.json(
      responseSuccess({
        transactionId,
        status: local.data.status,
        amount: local.data.amount,
        paidAt: local.data.paid_at,
      })
    );
  } catch (err) {
    logger.error("checkStatus:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "system error"));
  }
};

// POST /appotapay/callback - ipn callback from appotapay
exports.callback = async (req, res) => {
  try {
    const {
      orderId,
      transactionId: appotaTxId,
      errorCode,
      message: errorMsg,
      signature,
    } = req.body;
    logger.info("ipn callback:", JSON.stringify(req.body));

    if (signature) {
      const signData = `${errorCode || ""}${errorMsg || ""}${orderId}${
        appotaTxId || ""
      }${req.body.amount || ""}`;
      const calc = appotapayService.generateSignature(
        signData,
        appotapayService.config.secretKey
      );
      if (calc !== signature) logger.warn("signature mismatch");
    }

    const status = errorCode === 0 || errorCode === "0" ? "SUCCESS" : "FAILED";
    await appotapayService.updateTransactionStatus(orderId, {
      status,
      appotapayTransactionId: appotaTxId,
      errorCode: errorCode?.toString(),
      errorMessage: errorMsg,
      callbackData: req.body,
    });

    if (status === "SUCCESS") {
      const tx = await appotapayService.getTransactionById(orderId);
      await onPaymentSuccess(tx.data);
      logger.info(`payment success: ${orderId}`);
    }

    res.json({ errorCode: 0, message: "success", orderId });
  } catch (err) {
    logger.error("callback error:", err);
    res.status(500).json({ errorCode: -1, message: "internal error" });
  }
};

// GET /appotapay/return - redirect after payment completion
exports.returnUrl = async (req, res) => {
  try {
    const { orderId, errorCode, transactionId, message } = req.query;
    logger.info("return url:", req.query);

    const status =
      errorCode === "0" || errorCode === 0
        ? "SUCCESS"
        : errorCode
        ? "FAILED"
        : "PENDING";

    if (orderId) {
      await appotapayService.updateTransactionStatus(orderId, {
        status,
        appotapayTransactionId: transactionId,
        errorCode: errorCode?.toString(),
        errorMessage: message,
      });
      if (status === "SUCCESS") {
        const tx = await appotapayService.getTransactionById(orderId);
        await onPaymentSuccess(tx.data);
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/payment/result?orderId=${
        orderId || ""
      }&status=${status}&errorCode=${errorCode || ""}`
    );
  } catch (err) {
    logger.error("return error:", err);
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payment/result?status=ERROR`
    );
  }
};

// GET /appotapay/banks - get supported bank list
exports.getBanks = async (req, res) => {
  try {
    const result = await appotapayService.getBankList();
    if (!result.success)
      return res.json(
        responseWithError(ErrorCodes.SYSTEM_ERROR, "failed to get banks")
      );
    res.json(
      responseSuccess(
        result.data?.banks || result.data,
        result.isFallback ? "banks (offline)" : "banks"
      )
    );
  } catch (err) {
    logger.error("getBanks:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "system error"));
  }
};

// GET /appotapay/transactions - get user's transactions
exports.getTransactions = async (req, res) => {
  try {
    const { status, transactionType, limit, offset } = req.query;
    const result = await appotapayService.getTransactionsByUser(req.user.id, {
      status,
      transactionType,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });
    if (!result.success)
      return res.json(
        responseWithError(ErrorCodes.SYSTEM_ERROR, "failed to get transactions")
      );
    res.json(responseSuccess(result.data, "transactions"));
  } catch (err) {
    logger.error("getTransactions:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "system error"));
  }
};

// GET /appotapay/transaction/:transactionId - get transaction detail
exports.getTransactionDetail = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const result = await appotapayService.getTransactionById(transactionId);

    if (!result.success || !result.data)
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "transaction not found")
      );
    if (result.data.user_id !== req.user.id)
      return res.json(
        responseWithError(ErrorCodes.NOT_ALLOWED, "access denied")
      );

    res.json(responseSuccess(result.data, "transaction detail"));
  } catch (err) {
    logger.error("getTransactionDetail:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "system error"));
  }
};

// ============ production apis ============

// POST /appotapay/verify-account - verify bank account before transfer
exports.verifyBankAccount = async (req, res) => {
  try {
    const { bankCode, accountNo } = req.body;

    if (!bankCode || !accountNo) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "Thiếu bankCode hoặc accountNo"
        )
      );
    }

    const result = await appotapayService.verifyBankAccount({
      bankCode,
      accountNo,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.BAD_REQUEST,
          result.error?.message || "Tài khoản không hợp lệ"
        )
      );
    }

    res.json(responseSuccess(result.data, "Xác thực tài khoản thành công"));
  } catch (err) {
    logger.error("verifyBankAccount:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// POST /appotapay/refund - refund transaction
exports.createRefund = async (req, res) => {
  try {
    const { originalTransactionId, amount, reason } = req.body;
    const userId = req.user.id;

    if (!originalTransactionId || !amount) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "Thiếu originalTransactionId hoặc amount"
        )
      );
    }

    // check original transaction
    const originalTx = await appotapayService.getTransactionById(
      originalTransactionId
    );
    if (!originalTx.success || !originalTx.data) {
      return res.json(
        responseWithError(
          ErrorCodes.ITEM_NOT_EXIST,
          "Không tìm thấy giao dịch gốc"
        )
      );
    }

    // only admin or transaction owner can refund
    if (req.user.role === 1 && originalTx.data.user_id !== userId) {
      return res.json(
        responseWithError(ErrorCodes.NOT_ALLOWED, "Không có quyền hoàn tiền")
      );
    }

    // only successful transactions can be refunded
    if (originalTx.data.status !== "SUCCESS") {
      return res.json(
        responseWithError(
          ErrorCodes.BAD_REQUEST,
          "Chỉ có thể hoàn tiền giao dịch đã thành công"
        )
      );
    }

    // refund amount cannot exceed original amount
    if (amount > originalTx.data.amount) {
      return res.json(
        responseWithError(
          ErrorCodes.BAD_REQUEST,
          "Số tiền hoàn không được vượt quá số tiền gốc"
        )
      );
    }

    const result = await appotapayService.createRefund({
      originalTransactionId,
      amount,
      reason,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Hoàn tiền thất bại"
        )
      );
    }

    // save refund transaction
    await appotapayService.saveTransaction({
      userId,
      loanApplicationId: originalTx.data.loan_application_id,
      transactionId: result.transactionId,
      amount: -amount, // Số âm để phân biệt hoàn tiền
      transactionType: "REFUND",
      status: "PROCESSING",
    });

    res.json(
      responseSuccess(
        {
          transactionId: result.transactionId,
          originalTransactionId,
          amount,
          status: "PROCESSING",
        },
        "Yêu cầu hoàn tiền đã được gửi"
      )
    );
  } catch (err) {
    logger.error("createRefund:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// GET /appotapay/balance - check system balance (admin only)
exports.checkBalance = async (req, res) => {
  try {
    const result = await appotapayService.checkBalance();

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.error?.message || "Không thể kiểm tra số dư"
        )
      );
    }

    res.json(responseSuccess(result.data, "Số dư tài khoản"));
  } catch (err) {
    logger.error("checkBalance:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// POST /appotapay/disbursement-with-verify - disbursement with account verification and retry
exports.createDisbursementWithVerify = async (req, res) => {
  try {
    const {
      loanApplicationId,
      amount,
      bankCode,
      accountNo,
      accountName,
      content,
    } = req.body;
    const userId = req.user.id;

    if (!loanApplicationId || !amount || !bankCode || !accountNo) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "Thiếu thông tin bắt buộc"
        )
      );
    }

    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
    });
    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    // use disbursement with verify and retry
    const result = await appotapayService.createDisbursementWithRetry({
      userId,
      loanApplicationId,
      amount,
      bankCode,
      accountNo,
      accountName,
      content,
    });

    if (!result.success) {
      // classify error for frontend handling
      const errorResponse = {
        message: result.error?.message || "Giải ngân thất bại",
        errorType: result.errorType,
        needUserAction: result.needUserAction,
        retryCount: result.retryCount,
      };

      if (result.needUserAction) {
        errorResponse.suggestion =
          "Vui lòng kiểm tra lại thông tin tài khoản ngân hàng";
      }

      return res.json(
        responseWithError(ErrorCodes.SYSTEM_ERROR, errorResponse)
      );
    }

    // save transaction
    await appotapayService.saveTransaction({
      userId,
      loanApplicationId,
      transactionId: result.transactionId,
      appotapayTransactionId: result.data?.transactionId,
      amount,
      paymentMethod: "BANK",
      bankCode,
      transactionType: "DISBURSEMENT",
      status: "PROCESSING",
    });

    res.json(
      responseSuccess(
        {
          transactionId: result.transactionId,
          status: "PROCESSING",
          verifiedAccountName: result.data?.accountName,
        },
        "Giải ngân đã được gửi"
      )
    );
  } catch (err) {
    logger.error("createDisbursementWithVerify:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};
