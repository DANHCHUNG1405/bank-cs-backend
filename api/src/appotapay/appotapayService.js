// appotapay service - handles payment integration with appotapay

const axios = require("axios");
const crypto = require("crypto");
const models = require("../../../models");
const logger = require("../../../winston");

// appotapay config from env
const config = {
  get apiKey() {
    return process.env.APPOTAPAY_API_KEY;
  },
  get secretKey() {
    return process.env.APPOTAPAY_SECRET_KEY;
  },
  get partnerCode() {
    return process.env.APPOTAPAY_PARTNER_CODE;
  },
  get baseUrl() {
    return process.env.APPOTAPAY_BASE_URL;
  },
  get callbackUrl() {
    return process.env.APPOTAPAY_CALLBACK_URL;
  },
  get returnUrl() {
    return process.env.APPOTAPAY_RETURN_URL;
  },
};

// fallback banks when api fails
const FALLBACK_BANKS = [
  { bankCode: "MB", bankName: "MB Bank" },
  { bankCode: "VCB", bankName: "Vietcombank" },
  { bankCode: "TCB", bankName: "Techcombank" },
  { bankCode: "ACB", bankName: "ACB" },
  { bankCode: "VPB", bankName: "VPBank" },
  { bankCode: "TPB", bankName: "TPBank" },
  { bankCode: "BIDV", bankName: "BIDV" },
  { bankCode: "CTG", bankName: "Vietinbank" },
  { bankCode: "STB", bankName: "Sacombank" },
  { bankCode: "HDB", bankName: "HDBank" },
  { bankCode: "AGR", bankName: "Agribank" },
];

// ============ utils ============

const generateSignature = (data, secretKey) =>
  crypto.createHmac("sha256", secretKey).update(data).digest("hex");

const generateTxId = (prefix = "BCS") =>
  `${prefix}${Date.now()}${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

const generateJWT = () => {
  const ts = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT", cty: "appotapay-api;v=1" };
  const payload = {
    iss: config.partnerCode,
    jti: `${config.apiKey}-${ts}`,
    api_key: config.apiKey,
    exp: ts + 3600,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", config.secretKey)
    .update(`${b64Header}.${b64Payload}`)
    .digest("base64url");

  return `${b64Header}.${b64Payload}.${sig}`;
};

const parseDate = (val) =>
  val ? (isNaN(new Date(val).getTime()) ? null : new Date(val)) : null;

// ============ api request ============

const apiRequest = async (endpoint, method, data = null) => {
  const opts = {
    method,
    url: `${config.baseUrl}${endpoint}`,
    headers: {
      "Content-Type": "application/json",
      "X-APPOTAPAY-AUTH": `Bearer ${generateJWT()}`,
    },
    timeout: 30000,
  };
  if (data) opts.data = data;
  return axios(opts);
};

const buildPaymentBody = (
  txId,
  orderInfo,
  amount,
  method,
  extraData,
  bankCode
) => {
  const body = {
    transaction: {
      amount,
      currency: "VND",
      paymentMethod: method || "ALL",
      action: "PAY",
    },
    partnerReference: {
      order: { id: txId, info: orderInfo },
      notificationConfig: {
        notifyUrl: config.callbackUrl,
        redirectUrl: config.returnUrl,
      },
    },
    signature: generateSignature(
      `${amount}${txId}${orderInfo}`,
      config.secretKey
    ),
  };

  if (Object.keys(extraData).length)
    body.partnerReference.order.extraData = JSON.stringify(extraData);
  if (bankCode) {
    body.transaction.bankCode = bankCode;
    body.transaction.paymentMethod = "ATM";
  }

  return body;
};

const extractUrl = (res) =>
  res?.payment?.url || res?.paymentUrl || res?.payUrl || res?.url;
const extractQr = (res) =>
  res?.payment?.qrCode || res?.qrCode || res?.qrCodeUrl;

// ============ payment methods ============

const createPaymentOrder = async (data) => {
  const txId = generateTxId("PAY");

  if (!data?.amount || data.amount <= 0) {
    return {
      success: false,
      error: { message: "invalid amount" },
      transactionId: txId,
    };
  }

  const extra = {};
  if (data.userId) extra.userId = data.userId;
  if (data.loanApplicationId) extra.loanApplicationId = data.loanApplicationId;
  if (data.paymentId) extra.paymentId = data.paymentId;
  if (data.orderId) extra.orderId = data.orderId;

  const body = buildPaymentBody(
    txId,
    data.description || "Payment BankCS",
    Math.round(Number(data.amount)),
    data.paymentMethod,
    extra,
    data.bankCode
  );
  if (data.returnUrl)
    body.partnerReference.notificationConfig.redirectUrl = data.returnUrl;

  try {
    const res = await apiRequest("/api/v2/orders/payment", "POST", body);
    const payUrl = extractUrl(res.data);

    if (!payUrl)
      return {
        success: false,
        error: { message: "no payment url received" },
        transactionId: txId,
      };

    return {
      success: true,
      transactionId: txId,
      data: {
        transactionId: txId,
        paymentUrl: payUrl,
        payUrl,
        qrCode: extractQr(res.data),
        expireTime: res.data?.transaction?.expireTime,
        appotapayOrderId: res.data?.transaction?.transactionId,
      },
    };
  } catch (err) {
    logger.error("payment error:", err.response?.data || err.message);
    return {
      success: false,
      transactionId: txId,
      error: { message: err.response?.data?.message || err.message },
    };
  }
};

const createQRPayment = async (data) => {
  const txId = generateTxId("QR");

  if (!data?.amount || data.amount <= 0) {
    return {
      success: false,
      error: { message: "invalid amount" },
      transactionId: txId,
    };
  }

  const extra = {};
  if (data.userId) extra.userId = data.userId;
  if (data.loanApplicationId) extra.loanApplicationId = data.loanApplicationId;
  if (data.orderId) extra.orderId = data.orderId;

  const body = buildPaymentBody(
    txId,
    data.description || "QR Payment BankCS",
    Math.round(Number(data.amount)),
    "VA",
    extra,
    null
  );
  if (data.returnUrl)
    body.partnerReference.notificationConfig.redirectUrl = data.returnUrl;

  try {
    const res = await apiRequest("/api/v2/orders/payment", "POST", body);
    return {
      success: true,
      transactionId: txId,
      data: {
        transactionId: txId,
        qrCode: extractQr(res.data),
        qrCodeUrl: extractQr(res.data),
        paymentUrl: extractUrl(res.data),
        expireTime: res.data?.transaction?.expireTime,
        appotapayOrderId: res.data?.transaction?.transactionId,
      },
    };
  } catch (err) {
    logger.error("qr payment error:", err.response?.data || err.message);
    return {
      success: false,
      transactionId: txId,
      error: { message: err.response?.data?.message || err.message },
    };
  }
};

const createDisbursement = async (data) => {
  const txId = generateTxId("DIS");
  const body = {
    orderId: txId,
    amount: data.amount,
    bankCode: data.bankCode,
    accountNo: data.accountNo,
    accountName: data.accountName,
    content: data.content || "Disbursement",
    notifyUrl: config.callbackUrl,
    signature: generateSignature(`${data.amount}${txId}`, config.secretKey),
  };

  try {
    const res = await apiRequest("/api/v1/disbursement/bank", "POST", body);
    return { success: true, transactionId: txId, data: res.data };
  } catch (err) {
    logger.error("disbursement error:", err.response?.data || err.message);
    return {
      success: false,
      transactionId: txId,
      error: err.response?.data || { message: err.message },
    };
  }
};

const checkTransactionStatus = async (orderId) => {
  try {
    const res = await apiRequest(
      `/api/v2/orders/transaction/${orderId}`,
      "GET"
    );
    return { success: true, data: res.data };
  } catch (err) {
    logger.error("check status error:", err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};

const getBankList = async () => {
  try {
    const res = await apiRequest("/api/v2/banks/domestic", "GET");
    return { success: true, data: res.data };
  } catch (err) {
    return { success: true, data: { banks: FALLBACK_BANKS }, isFallback: true };
  }
};

// ============ refund ============

// create refund request
const createRefund = async (data) => {
  const txId = generateTxId("REF");

  if (!data.originalTransactionId || !data.amount) {
    return {
      success: false,
      error: { message: "Missing originalTransactionId or amount" },
    };
  }

  const body = {
    orderId: txId,
    originalOrderId: data.originalTransactionId,
    amount: Math.round(Number(data.amount)),
    reason: data.reason || "Refund",
    notifyUrl: config.callbackUrl,
    signature: generateSignature(
      `${data.amount}${txId}${data.originalTransactionId}`,
      config.secretKey
    ),
  };

  try {
    const res = await apiRequest("/api/v2/orders/refund", "POST", body);
    return { success: true, transactionId: txId, data: res.data };
  } catch (err) {
    logger.error("refund error:", err.response?.data || err.message);
    return {
      success: false,
      transactionId: txId,
      error: err.response?.data || { message: err.message },
    };
  }
};

// ============ verify bank account ============

// verify bank account before transfer
const verifyBankAccount = async (data) => {
  if (!data.bankCode || !data.accountNo) {
    return {
      success: false,
      error: { message: "Missing bankCode or accountNo" },
    };
  }

  const body = {
    bankCode: data.bankCode,
    accountNo: data.accountNo,
    signature: generateSignature(
      `${data.bankCode}${data.accountNo}`,
      config.secretKey
    ),
  };

  try {
    const res = await apiRequest("/api/v1/bank/account/verify", "POST", body);

    // check result
    if (res.data?.errorCode === 0 || res.data?.success) {
      return {
        success: true,
        data: {
          isValid: true,
          accountName: res.data?.accountName || res.data?.data?.accountName,
          bankCode: data.bankCode,
          accountNo: data.accountNo,
        },
      };
    }

    return {
      success: false,
      error: { message: res.data?.message || "Account verification failed" },
    };
  } catch (err) {
    logger.error("verify account error:", err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data || { message: err.message },
    };
  }
};

// ============ check balance ============

// check system balance (if appotapay supports)
const checkBalance = async () => {
  try {
    const res = await apiRequest("/api/v1/partner/balance", "GET");
    return {
      success: true,
      data: {
        balance: res.data?.balance || res.data?.data?.balance || 0,
        currency: "VND",
      },
    };
  } catch (err) {
    logger.error("check balance error:", err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data || { message: err.message },
    };
  }
};

// ============ disbursement with retry ============

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// create disbursement with account verification and auto retry
const createDisbursementWithRetry = async (data, retryCount = 0) => {
  // step 1: verify recipient account before transfer
  if (data.verifyAccount !== false) {
    const verifyResult = await verifyBankAccount({
      bankCode: data.bankCode,
      accountNo: data.accountNo,
    });

    if (!verifyResult.success) {
      return {
        success: false,
        error: {
          code: "INVALID_ACCOUNT",
          message: "Tài khoản ngân hàng không hợp lệ hoặc không tồn tại",
          details: verifyResult.error,
        },
        needUserAction: true, // Cần người dùng cập nhật lại tài khoản
      };
    }

    // update account name if verified
    if (verifyResult.data?.accountName) {
      data.accountName = verifyResult.data.accountName;
    }
  }

  // step 2: execute disbursement
  const result = await createDisbursement(data);

  if (result.success) {
    return result;
  }

  // step 3: handle error and retry
  const errorCode = result.error?.errorCode || result.error?.code;
  const isSystemError = isRetryableError(errorCode);

  if (isSystemError && retryCount < MAX_RETRY_COUNT) {
    logger.warn(
      `Disbursement failed, retrying... (${retryCount + 1}/${MAX_RETRY_COUNT})`
    );
    await sleep(RETRY_DELAY_MS * (retryCount + 1));
    return createDisbursementWithRetry(data, retryCount + 1);
  }

  // classify error for user notification
  return {
    ...result,
    retryCount,
    errorType: isSystemError ? "SYSTEM_ERROR" : "BANK_ERROR",
    needUserAction: !isSystemError, // Lỗi ngân hàng cần user kiểm tra lại
  };
};

// check if error is retryable
const isRetryableError = (errorCode) => {
  const retryableCodes = [
    "TIMEOUT",
    "CONNECTION_ERROR",
    "SYSTEM_BUSY",
    "SERVICE_UNAVAILABLE",
    "INTERNAL_ERROR",
    "-1", // Generic error
    "500",
    "503",
  ];
  return retryableCodes.includes(String(errorCode));
};

// ============ db operations ============

const saveTransaction = async (data) => {
  try {
    const tx = await models.appotapay_transaction.create({
      user_id: data.userId,
      payment_id: data.paymentId || null,
      loan_application_id: data.loanApplicationId || null,
      order_id: data.orderId || null,
      transaction_id: data.transactionId,
      appotapay_transaction_id: data.appotapayTransactionId || null,
      amount: data.amount,
      currency: data.currency || "VND",
      payment_method: data.paymentMethod || null,
      bank_code: data.bankCode || null,
      transaction_type: data.transactionType || "REPAYMENT",
      status: data.status || "PENDING",
      payment_url: data.paymentUrl || null,
      qr_code: data.qrCode || null,
      expired_at: parseDate(data.expiredAt),
      created_by: data.userId?.toString() || null,
    });
    return { success: true, data: tx };
  } catch (err) {
    logger.error("save transaction error:", err.message);
    return { success: false, error: err.message };
  }
};

const updateTransactionStatus = async (txId, data) => {
  try {
    await models.appotapay_transaction.update(
      {
        status: data.status,
        appotapay_transaction_id: data.appotapayTransactionId,
        error_code: data.errorCode,
        error_message: data.errorMessage,
        callback_data: data.callbackData
          ? JSON.stringify(data.callbackData)
          : null,
        paid_at: data.status === "SUCCESS" ? new Date() : null,
        updated_date: new Date(),
      },
      { where: { transaction_id: txId } }
    );
    return { success: true };
  } catch (err) {
    logger.error("update status error:", err.message);
    return { success: false, error: err.message };
  }
};

const getTransactionById = async (txId) => {
  try {
    const tx = await models.appotapay_transaction.findOne({
      where: { transaction_id: txId, deleted: 0 },
    });
    return { success: true, data: tx };
  } catch (err) {
    logger.error("get transaction error:", err.message);
    return { success: false, error: err.message };
  }
};

const getTransactionsByUser = async (userId, opts = {}) => {
  try {
    const where = { user_id: userId, deleted: 0 };
    if (opts.status) where.status = opts.status;
    if (opts.transactionType) where.transaction_type = opts.transactionType;

    const txs = await models.appotapay_transaction.findAll({
      where,
      order: [["created_date", "DESC"]],
      limit: opts.limit || 20,
      offset: opts.offset || 0,
    });
    return { success: true, data: txs };
  } catch (err) {
    logger.error("get transactions error:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  config,
  generateSignature,
  generateTxId,
  createPaymentOrder,
  createQRPayment,
  createDisbursement,
  createDisbursementWithRetry,
  createRefund,
  verifyBankAccount,
  checkBalance,
  checkTransactionStatus,
  getBankList,
  saveTransaction,
  updateTransactionStatus,
  getTransactionById,
  getTransactionsByUser,
  isRetryableError,
  MAX_RETRY_COUNT,
};
