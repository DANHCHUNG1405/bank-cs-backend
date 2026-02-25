// cic service - handles all cic api calls
// login, credit check, instant/periodic reports per nhnn 2970

const axios = require("axios");
const models = require("../../../models");
const logger = require("../../../winston");

// config from env
const config = {
  get baseUrl() {
    return process.env.CIC_BASE_URL || "https://api-gateway.cic.pro.vn";
  },
  get username() {
    return process.env.CIC_USERNAME;
  },
  get password() {
    return process.env.CIC_PASSWORD;
  },
  get companyCode() {
    return process.env.CIC_COMPANY_CODE;
  },
  get timeout() {
    return parseInt(process.env.CIC_TIMEOUT) || 30000;
  },
};

// report types
const REPORT_TYPES = {
  INSTANT_NEW: "INSTANT_NEW", // new loan
  INSTANT_OLD: "INSTANT_OLD", // existing loan change
  DAILY: "DAILY", // d1 daily
  MONTHLY: "MONTHLY", // d2 monthly
  CHECK: "CHECK", // credit check
};

// debt groups 1-5 per nhnn
const DEBT_GROUP = {
  NORMAL: 1,
  ATTENTION: 2,
  SUBSTANDARD: 3,
  DOUBTFUL: 4,
  BAD: 5,
};

// credit score grades
const CREDIT_GRADES = {
  A: { min: 750, max: 900, risk: "LOW" },
  B: { min: 650, max: 749, risk: "MEDIUM_LOW" },
  C: { min: 550, max: 649, risk: "MEDIUM" },
  D: { min: 450, max: 549, risk: "MEDIUM_HIGH" },
  E: { min: 300, max: 449, risk: "HIGH" },
};

// cic error codes
const ERROR_CODES = {
  "0x00110": "wrong username or password",
  "0x00109": "account locked",
  "0x00115": "invalid data",
  "0x00201": "invalid cccd",
  "0x00202": "invalid birthdate",
  "0x00203": "invalid amount",
  "0x00210": "duplicate transaction code",
  EKT001_BC005: "violation - no cic check before loan",
};

// token storage
let tokenData = {
  token: null,
  expiresAt: null,
  passwordExpiresIn: null,
};

const isTokenValid = () => {
  if (!tokenData.token || !tokenData.expiresAt) return false;
  return Date.now() < tokenData.expiresAt;
};

// helpers
const generateTransactionCode = (prefix = "BC") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const formatDateTime = (date) => {
  const d = new Date(date);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

const generateReportFileName = (type, date, sequence = "001") => {
  const prefix = type === REPORT_TYPES.DAILY ? "D1" : "D2";
  const dateStr = formatDate(date);
  return `${prefix}${config.companyCode}${dateStr}.${sequence}.json`;
};

// api request wrapper
const apiRequest = async (
  endpoint,
  method,
  data = null,
  requireAuth = true
) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    if (!isTokenValid()) {
      const loginResult = await login();
      if (!loginResult.success) {
        throw new Error("CIC authentication failed");
      }
    }
    headers["Authorization"] = `Bearer ${tokenData.token}`;
  }

  try {
    const response = await axios({
      method,
      url: `${config.baseUrl}${endpoint}`,
      headers,
      data,
      timeout: config.timeout,
    });
    return response.data;
  } catch (error) {
    logger.error(
      `CIC API Error [${endpoint}]:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// auth apis

// login to get token
const login = async (username = null, password = null) => {
  try {
    const response = await apiRequest(
      "/xac-thuc/DangNhap",
      "POST",
      {
        TenDangNhap: username || config.username,
        MatKhau: password || config.password,
      },
      false
    );

    if (response.TrangThai === 1 && response.DuLieu) {
      const { Token, ThoiGianHetHan, MatKhauHetHan } = response.DuLieu;

      tokenData = {
        token: Token,
        expiresAt: Date.now() + (ThoiGianHetHan || 3600) * 1000,
        passwordExpiresIn: MatKhauHetHan,
      };

      logger.info("CIC login successful");
      return {
        success: true,
        data: {
          token: Token,
          expiresIn: ThoiGianHetHan,
          passwordExpiresIn: MatKhauHetHan,
        },
      };
    }

    return {
      success: false,
      error: {
        code: response.MaLoi,
        message:
          ERROR_CODES[response.MaLoi] || response.ThongBao || "Login failed",
      },
    };
  } catch (error) {
    logger.error("CIC login error:", error.message);
    return { success: false, error: { message: error.message } };
  }
};

// change password
const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await apiRequest("/xac-thuc/DoiMatKhau", "POST", {
      TenDangNhap: config.username,
      MatKhauCu: oldPassword,
      MatKhauMoi: newPassword,
    });

    if (response.TrangThai === 1) {
      // Token hết hiệu lực sau khi đổi mật khẩu
      tokenData = { token: null, expiresAt: null, passwordExpiresIn: null };
      return { success: true, message: "Đổi mật khẩu thành công" };
    }

    return {
      success: false,
      error: {
        code: response.MaLoi,
        message: ERROR_CODES[response.MaLoi] || response.ThongBao,
      },
    };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

// logout
const logout = async () => {
  try {
    await apiRequest("/xac-thuc/DangXuat", "POST", {});
    tokenData = { token: null, expiresAt: null, passwordExpiresIn: null };
    return { success: true };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

// credit check apis

// check credit before loan approval - required by nhnn 2970
const checkCredit = async (data) => {
  const transactionCode = generateTransactionCode("KTR");

  try {
    const payload = {
      CT001: data.cccd,
      CT003: data.customerName,
      CT004: data.birthDate ? formatDate(data.birthDate) : null,
      SanPham: data.productCode || "SP001",
    };

    const response = await apiRequest("/tin-dung/KiemTra", "POST", payload);

    // Lưu kết quả kiểm tra
    const reportData = {
      transactionCode: response.MaGiaoDich || transactionCode,
      reportType: REPORT_TYPES.CHECK,
      loanApplicationId: data.loanApplicationId,
      userId: data.userId,
      customerCccd: data.cccd,
      customerName: data.customerName,
      processingStatus: response.TrangThai === 1 ? "SUCCESS" : "FAILED",
      cicResponseCode: response.MaLoi,
    };

    if (response.TrangThai === 1) {
      const customerInfo = response.ThongTinKhachHang || {};
      const loanHistory = response.LichSuVay || {};
      const warnings = response.CanhBao || [];

      reportData.creditScore = customerInfo.DiemTinDung;
      reportData.creditGrade = customerInfo.XepHang;
      reportData.totalDebtP2p = loanHistory.TongDuNo || 0;
      reportData.hasBadDebt = loanHistory.NoQuaHan > 0 ? 1 : 0;

      await saveReport(reportData);

      // Đánh giá rủi ro
      const riskAssessment = assessCreditRisk(response);

      return {
        success: true,
        transactionCode: response.MaGiaoDich,
        data: {
          cccd: customerInfo.CT001,
          customerName: customerInfo.CT003,
          creditScore: customerInfo.DiemTinDung,
          creditGrade: customerInfo.XepHang,
          totalLoans: loanHistory.TongKhoanVay || 0,
          activeLoans: loanHistory.KhoanVayDangHoatDong || 0,
          totalDebt: loanHistory.TongDuNo || 0,
          overdueDebt: loanHistory.NoQuaHan || 0,
          hasBadDebt: loanHistory.NoQuaHan > 0,
          warnings,
          riskAssessment,
          canApprove: riskAssessment.decision !== "REJECT",
        },
      };
    }

    await saveReport(reportData);
    return {
      success: false,
      transactionCode,
      error: {
        code: response.MaLoi,
        message: ERROR_CODES[response.MaLoi] || response.ThongBao,
      },
    };
  } catch (error) {
    logger.error("KiemTra error:", error.message);
    return {
      success: false,
      transactionCode,
      error: { message: error.message },
    };
  }
};

// assess credit risk based on cic response
const assessCreditRisk = (cicResponse) => {
  const customerInfo = cicResponse.ThongTinKhachHang || {};
  const loanHistory = cicResponse.LichSuVay || {};
  const warnings = cicResponse.CanhBao || [];

  const creditScore = customerInfo.DiemTinDung || 0;
  const activeLoans = loanHistory.KhoanVayDangHoatDong || 0;
  const overdueDebt = loanHistory.NoQuaHan || 0;

  // Tính điểm rủi ro (0-100)
  let riskScore = 0;

  // Credit score factor (40%)
  if (creditScore >= 750) riskScore += 40;
  else if (creditScore >= 650) riskScore += 30;
  else if (creditScore >= 550) riskScore += 20;
  else if (creditScore >= 450) riskScore += 10;

  // Active loans factor (30%)
  if (activeLoans === 0) riskScore += 30;
  else if (activeLoans <= 2) riskScore += 20;
  else if (activeLoans <= 4) riskScore += 10;

  // Overdue debt factor (30%)
  if (overdueDebt === 0) riskScore += 30;
  else if (overdueDebt < 1000000) riskScore += 15;

  // Kiểm tra cảnh báo nghiêm trọng
  const criticalWarnings = warnings.filter((w) => w.MucDo === "CAO");
  if (criticalWarnings.length > 0) {
    return {
      decision: "REJECT",
      reason: "Phát hiện cảnh báo nghiêm trọng",
      riskScore,
      warnings: criticalWarnings,
    };
  }

  // Quyết định dựa trên điểm rủi ro
  if (riskScore >= 80) {
    return {
      decision: "APPROVE",
      reason: "Rủi ro thấp, hồ sơ tín dụng tốt",
      riskScore,
      recommendedInterestRate: "STANDARD",
    };
  } else if (riskScore >= 60) {
    return {
      decision: "APPROVE_WITH_CONDITIONS",
      reason: "Rủi ro trung bình, cần bổ sung hồ sơ",
      riskScore,
      recommendedInterestRate: "STANDARD_PLUS_1%",
      conditions: ["Yêu cầu chứng minh thu nhập", "Cân nhắc giảm hạn mức"],
    };
  } else if (riskScore >= 40) {
    return {
      decision: "MANUAL_REVIEW",
      reason: "Cần xét duyệt thủ công bởi admin",
      riskScore,
    };
  } else {
    return {
      decision: "REJECT",
      reason: "Rủi ro cao, điểm tín dụng thấp",
      riskScore,
    };
  }
};

// lookup check result by transaction code
const lookupCheck = async (transactionCode) => {
  try {
    const response = await apiRequest("/tin-dung/TraCuu", "POST", {
      MaGiaoDich: transactionCode,
    });

    if (response.TrangThai === 1) {
      return { success: true, data: response };
    }

    return {
      success: false,
      error: {
        code: response.MaLoi,
        message: ERROR_CODES[response.MaLoi] || response.ThongBao,
      },
    };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

// reporting apis

// instant report for new loan - send right after disbursement
const reportNewLoan = async (data) => {
  const transactionCode = generateTransactionCode("C");

  try {
    const payload = {
      BC005: transactionCode,
      CT001: data.cccd,
      CT003: data.customerName,
      CT004: data.birthDate ? formatDate(data.birthDate) : null,
      CT005: data.phone,
      CT006: data.gender, // 1: Nam, 2: Nữ
      CT031: data.loanAmount,
    };

    const response = await apiRequest(
      "/tin-dung/BaoCaoTucThoi/KhoanVayMoi",
      "POST",
      payload
    );

    // Lưu báo cáo
    await saveReport({
      transactionCode,
      reportType: REPORT_TYPES.INSTANT_NEW,
      loanApplicationId: data.loanApplicationId,
      userId: data.userId,
      customerCccd: data.cccd,
      customerName: data.customerName,
      loanAmount: data.loanAmount,
      processingStatus: response.TrangThai === 1 ? "SUCCESS" : "FAILED",
      cicResponseCode: response.MaLoi,
      cicWarnings: JSON.stringify(response.DanhSachCanhBao || []),
    });

    if (response.TrangThai === 1) {
      // Kiểm tra cảnh báo vi phạm không kiểm tra CIC
      const warnings = response.DanhSachCanhBao || [];
      const cicViolation = warnings.find((w) => w.Ma === "EKT001_BC005");

      return {
        success: true,
        transactionCode,
        receivedAt: response.BC010,
        warnings,
        cicViolation: !!cicViolation,
      };
    }

    return {
      success: false,
      transactionCode,
      error: {
        code: response.MaLoi,
        message: ERROR_CODES[response.MaLoi] || response.ThongBao,
      },
    };
  } catch (error) {
    logger.error("BaoCaoTucThoi/KhoanVayMoi error:", error.message);
    return {
      success: false,
      transactionCode,
      error: { message: error.message },
    };
  }
};

// instant report for existing loan changes (payment, extension, settlement)
const reportOldLoan = async (data) => {
  try {
    const payload = {
      CT001: data.cccd,
      CT003: data.customerName,
      CT004: data.birthDate ? formatDate(data.birthDate) : null,
      CT005: data.phone,
      CT006: data.gender,
      CT031: data.outstandingBalance, // Số dư nợ còn lại
      BC005: data.originalTransactionCode, // Mã giao dịch gốc
      BC020: data.changeType, // THANHTOAN/GIAHAN/TATTOAN
    };

    const response = await apiRequest(
      "/tin-dung/BaoCaoTucThoi/KhoanVayCu",
      "POST",
      payload
    );

    // Lưu báo cáo
    await saveReport({
      transactionCode: data.originalTransactionCode,
      reportType: REPORT_TYPES.INSTANT_OLD,
      loanApplicationId: data.loanApplicationId,
      userId: data.userId,
      customerCccd: data.cccd,
      customerName: data.customerName,
      outstandingBalance: data.outstandingBalance,
      processingStatus: response.TrangThai === 1 ? "SUCCESS" : "FAILED",
      cicResponseCode: response.MaLoi,
    });

    if (response.TrangThai === 1) {
      return {
        success: true,
        receivedAt: response.BC010,
      };
    }

    return {
      success: false,
      error: {
        code: response.MaLoi,
        message: ERROR_CODES[response.MaLoi] || response.ThongBao,
      },
    };
  } catch (error) {
    logger.error("BaoCaoTucThoi/KhoanVayCu error:", error.message);
    return { success: false, error: { message: error.message } };
  }
};

// periodic report d1 (daily before 23:59) / d2 (monthly before 10th)
const reportPeriodic = async (type, reportDate, transactions) => {
  const fileName = generateReportFileName(type, reportDate);
  const dateStr = formatDate(reportDate);

  try {
    const payload = {
      TenTep: fileName,
      NgayBaoCao: dateStr,
      DanhSachGiaoDich: transactions.map((t) => ({
        BC005: t.transactionCode || generateTransactionCode("C"),
        CT001: t.cccd,
        CT003: t.customerName,
        CT004: t.birthDate ? formatDate(t.birthDate) : null,
        CT005: t.phone,
        CT006: t.gender,
        CT031: t.loanAmount || t.outstandingBalance,
      })),
    };

    const response = await apiRequest(
      "/tin-dung/BaoCaoDinhKy",
      "POST",
      payload
    );

    // Lưu báo cáo
    await saveReport({
      reportFileName: fileName,
      reportPeriod: dateStr,
      reportType: type,
      reportContent: JSON.stringify(payload),
      processingStatus: response.TrangThai === 1 ? "SUCCESS" : "FAILED",
      cicResponseCode: response.MaLoi,
      cicWarnings: JSON.stringify(response.DanhSachLoi || []),
    });

    if (response.TrangThai === 1) {
      return {
        success: true,
        fileName: response.TenTep,
        totalTransactions: response.TongGiaoDich,
        successCount: response.ThanhCong,
        failedCount: response.ThatBai,
        errors: response.DanhSachLoi || [],
      };
    }

    return {
      success: false,
      fileName,
      error: {
        code: response.MaLoi,
        message: ERROR_CODES[response.MaLoi] || response.ThongBao,
        errors: response.DanhSachLoi || [],
      },
    };
  } catch (error) {
    logger.error("BaoCaoDinhKy error:", error.message);
    return { success: false, fileName, error: { message: error.message } };
  }
};

// statistics apis

// check statistics
const statisticsCheck = async (fromDate, toDate) => {
  try {
    const response = await apiRequest("/tin-dung/ThongKeKiemTra", "POST", {
      TuNgay: formatDate(fromDate),
      DenNgay: formatDate(toDate),
    });

    if (response.TrangThai === 1) {
      return {
        success: true,
        data: {
          totalRecords: response.TongSoBanGhi || 0,
          records: response.DanhSach || [],
        },
      };
    }

    return { success: false, error: { message: response.ThongBao } };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

// instant report statistics
const statisticsInstantReports = async (fromDate, toDate, status = null) => {
  try {
    const payload = {
      TuNgay: formatDate(fromDate),
      DenNgay: formatDate(toDate),
    };
    if (status !== null) payload.TrangThai = status;

    const response = await apiRequest(
      "/tin-dung/ThongKeBaoCaoTucThoi",
      "POST",
      payload
    );

    if (response.TrangThai === 1) {
      return {
        success: true,
        data: {
          totalRecords: response.TongSoBanGhi || 0,
          records: response.DanhSach || [],
        },
      };
    }

    return { success: false, error: { message: response.ThongBao } };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

// periodic report statistics
const statisticsPeriodicReports = async (fromDate, toDate) => {
  try {
    const response = await apiRequest("/tin-dung/ThongKeBaoCaoDinhKy", "POST", {
      TuNgay: formatDate(fromDate),
      DenNgay: formatDate(toDate),
    });

    if (response.TrangThai === 1) {
      return {
        success: true,
        data: {
          totalRecords: response.TongSoBanGhi || 0,
          records: response.DanhSach || [],
        },
      };
    }

    return { success: false, error: { message: response.ThongBao } };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

// lookup periodic report by filename
const lookupPeriodicReport = async (fileName) => {
  try {
    const response = await apiRequest("/tin-dung/TraCuuBaoCaoDinhKy", "POST", {
      TenTep: fileName,
    });

    if (response.TrangThai === 1) {
      return {
        success: true,
        data: {
          fileName: response.TenTep,
          status: response.TrangThai,
          errors: response.DanhSachLoi || [],
        },
      };
    }

    return { success: false, error: { message: response.ThongBao } };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

// db operations

// save report to db - must keep 5 years per nhnn 2970
const saveReport = async (data) => {
  try {
    const report = await models.cic_report.create({
      report_file_name: data.reportFileName || null,
      company_code: config.companyCode,
      report_period: data.reportPeriod || null,
      report_type: data.reportType,
      transaction_code: data.transactionCode || null,
      report_content: data.reportContent || null,
      processing_status: data.processingStatus || "PENDING",
      loan_application_id: data.loanApplicationId || null,
      user_id: data.userId || null,
      customer_cccd: data.customerCccd || null,
      customer_name: data.customerName || null,
      customer_type: data.customerType || 1,
      contract_code: data.contractCode || null,
      loan_amount: data.loanAmount || null,
      outstanding_balance: data.outstandingBalance || null,
      total_debt_p2p: data.totalDebtP2p || null,
      has_bad_debt: data.hasBadDebt || 0,
      credit_score: data.creditScore || null,
      credit_grade: data.creditGrade || null,
      cic_response_code: data.cicResponseCode || null,
      cic_response_message: data.cicResponseMessage || null,
      cic_warnings: data.cicWarnings || null,
      cic_errors: data.cicErrors || null,
      created_by: data.createdBy || "system",
    });
    return { success: true, data: report };
  } catch (error) {
    logger.error("Save CIC report error:", error.message);
    return { success: false, error: error.message };
  }
};

// get report by transaction code
const getReportByTransactionCode = async (transactionCode) => {
  try {
    const report = await models.cic_report.findOne({
      where: { transaction_code: transactionCode, deleted: 0 },
    });
    return { success: true, data: report };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// get reports by loan application id
const getReportsByLoanApplication = async (loanApplicationId) => {
  try {
    const reports = await models.cic_report.findAll({
      where: { loan_application_id: loanApplicationId, deleted: 0 },
      order: [["created_date", "DESC"]],
    });
    return { success: true, data: reports };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// get failed reports for retry
const getFailedReportsForRetry = async (maxRetries = 3) => {
  try {
    const { Op } = require("sequelize");
    const reports = await models.cic_report.findAll({
      where: {
        processing_status: "FAILED",
        retry_count: { [Op.lt]: maxRetries },
        deleted: 0,
      },
      order: [["created_date", "ASC"]],
      limit: 100,
    });
    return { success: true, data: reports };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// update retry count
const updateRetryCount = async (reportId) => {
  try {
    await models.cic_report.update(
      {
        retry_count: models.sequelize.literal("retry_count + 1"),
        last_retry_at: new Date(),
        updated_date: new Date(),
      },
      { where: { id: reportId } }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// exports
module.exports = {
  // Config & Constants
  config,
  REPORT_TYPES,
  DEBT_GROUP,
  CREDIT_GRADES,
  ERROR_CODES,

  // Utilities
  generateTransactionCode,
  formatDate,
  formatDateTime,
  generateReportFileName,
  isTokenValid,

  // Authentication APIs
  login,
  changePassword,
  logout,

  // Credit Checking APIs
  checkCredit,
  lookupCheck,
  assessCreditRisk,

  // Credit Reporting APIs
  reportNewLoan,
  reportOldLoan,
  reportPeriodic,

  // Statistics APIs
  statisticsCheck,
  statisticsInstantReports,
  statisticsPeriodicReports,
  lookupPeriodicReport,

  // Database Operations
  saveReport,
  getReportByTransactionCode,
  getReportsByLoanApplication,
  getFailedReportsForRetry,
  updateRetryCount,
};
