// compliance service - checks before loan approval
// cic check required by nhnn 2970

const cicService = require("./cicService");
const models = require("../../../models");
const logger = require("../../../winston");

// constants
const COMPLIANCE_STATUS = {
  PASSED: "PASSED",
  FAILED: "FAILED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  PENDING: "PENDING",
  ERROR: "ERROR",
};

const REJECTION_REASONS = {
  BAD_DEBT: "Khách hàng có nợ xấu (nhóm 3-5) trên hệ thống CIC",
  LOW_CREDIT_SCORE: "Điểm tín dụng quá thấp",
  HIGH_OVERDUE_DEBT: "Nợ quá hạn vượt ngưỡng cho phép",
  HIGH_DEBT_RATIO: "Tỷ lệ nợ/thu nhập vượt ngưỡng cho phép",
  CIC_ERROR: "Không thể kiểm tra thông tin CIC",
  TOO_MANY_ACTIVE_LOANS: "Có quá nhiều khoản vay đang hoạt động",
};

// Config từ env
const config = {
  enableCicCheck: process.env.ENABLE_CIC_CHECK !== "false",
  maxDebtRatio: parseFloat(process.env.MAX_DEBT_RATIO) || 0.5,
  maxTotalDebtP2P: parseInt(process.env.MAX_TOTAL_DEBT_P2P) || 500000000,
  minCreditScore: 450, // Điểm tín dụng tối thiểu
  maxActiveLoans: 5, // Số khoản vay tối đa đang hoạt động
  maxOverdueDebt: 5000000, // Nợ quá hạn tối đa cho phép
};

// check cic before loan approval - required by nhnn 2970
const checkCIC = async (data) => {
  if (!config.enableCicCheck) {
    logger.info("CIC check is disabled");
    return {
      passed: true,
      status: COMPLIANCE_STATUS.PASSED,
      reason: "CIC check disabled",
      skipped: true,
    };
  }

  try {
    logger.info(`Starting CIC check for CCCD: ${maskCCCD(data.cccd)}`);

    const result = await cicService.checkCredit({
      cccd: data.cccd,
      customerName: data.customerName,
      birthDate: data.birthDate,
      loanApplicationId: data.loanApplicationId,
      userId: data.userId,
    });

    if (!result.success) {
      logger.error("CIC check failed:", result.error);
      return {
        passed: false,
        status: COMPLIANCE_STATUS.ERROR,
        reason: REJECTION_REASONS.CIC_ERROR,
        error: result.error,
        transactionCode: result.transactionCode,
      };
    }

    const cicData = result.data;
    const riskAssessment = cicData.riskAssessment;

    // Auto-reject nếu có nợ xấu
    if (cicData.hasBadDebt) {
      logger.warn(
        `CIC check FAILED - Bad debt detected for ${maskCCCD(data.cccd)}`
      );
      return {
        passed: false,
        status: COMPLIANCE_STATUS.FAILED,
        reason: REJECTION_REASONS.BAD_DEBT,
        transactionCode: result.transactionCode,
        details: {
          creditScore: cicData.creditScore,
          creditGrade: cicData.creditGrade,
          totalDebt: cicData.totalDebt,
          overdueDebt: cicData.overdueDebt,
          hasBadDebt: true,
        },
      };
    }

    // Auto-reject nếu điểm tín dụng quá thấp
    if (cicData.creditScore && cicData.creditScore < config.minCreditScore) {
      logger.warn(
        `CIC check FAILED - Low credit score for ${maskCCCD(data.cccd)}`
      );
      return {
        passed: false,
        status: COMPLIANCE_STATUS.FAILED,
        reason: REJECTION_REASONS.LOW_CREDIT_SCORE,
        transactionCode: result.transactionCode,
        details: {
          creditScore: cicData.creditScore,
          minRequired: config.minCreditScore,
        },
      };
    }

    // Auto-reject nếu nợ quá hạn cao
    if (cicData.overdueDebt > config.maxOverdueDebt) {
      logger.warn(
        `CIC check FAILED - High overdue debt for ${maskCCCD(data.cccd)}`
      );
      return {
        passed: false,
        status: COMPLIANCE_STATUS.FAILED,
        reason: REJECTION_REASONS.HIGH_OVERDUE_DEBT,
        transactionCode: result.transactionCode,
        details: {
          overdueDebt: cicData.overdueDebt,
          maxAllowed: config.maxOverdueDebt,
        },
      };
    }

    // Cảnh báo nếu cần review
    const warnings = [];
    if (cicData.totalDebt > config.maxTotalDebtP2P) {
      warnings.push(
        `Tổng dư nợ P2P cao: ${cicData.totalDebt.toLocaleString()}đ`
      );
    }
    if (cicData.activeLoans > 3) {
      warnings.push(`Có ${cicData.activeLoans} khoản vay đang hoạt động`);
    }
    if (cicData.warnings?.length > 0) {
      warnings.push(...cicData.warnings.map((w) => w.Ten || w.message));
    }

    // Xác định trạng thái dựa trên risk assessment
    let status = COMPLIANCE_STATUS.PASSED;
    if (riskAssessment?.decision === "MANUAL_REVIEW") {
      status = COMPLIANCE_STATUS.REVIEW_REQUIRED;
    } else if (riskAssessment?.decision === "APPROVE_WITH_CONDITIONS") {
      status =
        warnings.length > 0
          ? COMPLIANCE_STATUS.REVIEW_REQUIRED
          : COMPLIANCE_STATUS.PASSED;
    }

    logger.info(`CIC check ${status} for ${maskCCCD(data.cccd)}`);
    return {
      passed: true,
      status,
      reason: "Kiểm tra CIC thành công",
      transactionCode: result.transactionCode,
      warnings,
      details: {
        creditScore: cicData.creditScore,
        creditGrade: cicData.creditGrade,
        totalDebt: cicData.totalDebt,
        overdueDebt: cicData.overdueDebt,
        activeLoans: cicData.activeLoans,
        hasBadDebt: false,
        canApprove: cicData.canApprove,
        riskAssessment,
      },
    };
  } catch (error) {
    logger.error("CIC check error:", error);
    return {
      passed: false,
      status: COMPLIANCE_STATUS.ERROR,
      reason: REJECTION_REASONS.CIC_ERROR,
      error: { message: error.message },
    };
  }
};

// check debt to income ratio
const checkDebtToIncomeRatio = async (data) => {
  try {
    const { loanAmount, monthlyIncome, userId } = data;

    if (!monthlyIncome || monthlyIncome <= 0) {
      return {
        passed: true,
        status: COMPLIANCE_STATUS.REVIEW_REQUIRED,
        reason: "Không có thông tin thu nhập - cần review",
      };
    }

    // Tính tổng nợ hiện tại
    const { Op } = require("sequelize");
    const existingLoans = await models.loan_application.findAll({
      where: {
        user_id: userId,
        status: { [Op.in]: [3, 4] }, // Đang trả nợ
        deleted: 0,
      },
      include: [{ model: models.loan_information }],
    });

    let totalMonthlyPayment = 0;
    for (const loan of existingLoans) {
      totalMonthlyPayment += loan.loan_information?.payment_per_period || 0;
    }

    // Thêm khoản vay mới
    const newMonthlyPayment = loanAmount / (data.loanTerm || 12);
    totalMonthlyPayment += newMonthlyPayment;

    const debtRatio = totalMonthlyPayment / monthlyIncome;

    if (debtRatio > config.maxDebtRatio) {
      return {
        passed: false,
        status: COMPLIANCE_STATUS.FAILED,
        reason: REJECTION_REASONS.HIGH_DEBT_RATIO,
        details: {
          debtRatio: (debtRatio * 100).toFixed(2) + "%",
          maxAllowed: config.maxDebtRatio * 100 + "%",
          totalMonthlyPayment,
          monthlyIncome,
        },
      };
    }

    return {
      passed: true,
      status: COMPLIANCE_STATUS.PASSED,
      details: {
        debtRatio: (debtRatio * 100).toFixed(2) + "%",
      },
    };
  } catch (error) {
    logger.error("Debt ratio check error:", error);
    return {
      passed: true,
      status: COMPLIANCE_STATUS.REVIEW_REQUIRED,
      reason: "Không thể tính tỷ lệ nợ - cần review",
    };
  }
};

// check active loans count
const checkActiveLoans = async (userId) => {
  try {
    const { Op } = require("sequelize");
    const activeLoansCount = await models.loan_application.count({
      where: {
        user_id: userId,
        status: { [Op.in]: [3, 4] },
        deleted: 0,
      },
    });

    if (activeLoansCount >= config.maxActiveLoans) {
      return {
        passed: false,
        status: COMPLIANCE_STATUS.FAILED,
        reason: REJECTION_REASONS.TOO_MANY_ACTIVE_LOANS,
        details: {
          activeLoans: activeLoansCount,
          maxAllowed: config.maxActiveLoans,
        },
      };
    }

    return {
      passed: true,
      status: COMPLIANCE_STATUS.PASSED,
      details: { activeLoans: activeLoansCount },
    };
  } catch (error) {
    logger.error("Active loans check error:", error);
    return {
      passed: true,
      status: COMPLIANCE_STATUS.REVIEW_REQUIRED,
      reason: "Không thể kiểm tra số khoản vay - cần review",
    };
  }
};

// run full compliance check: cic -> debt ratio -> active loans
const runFullComplianceCheck = async (data) => {
  logger.info(
    `Starting compliance check for loan application ${data.loanApplicationId}`
  );

  const results = {
    loanApplicationId: data.loanApplicationId,
    userId: data.userId,
    checkDate: new Date(),
    checks: {},
    overallStatus: COMPLIANCE_STATUS.PENDING,
    rejectionReasons: [],
    warnings: [],
  };

  try {
    // 1. Kiểm tra CIC (bắt buộc theo QĐ 2970)
    const cicResult = await checkCIC(data);
    results.checks.cic = cicResult;

    if (!cicResult.passed && cicResult.status === COMPLIANCE_STATUS.FAILED) {
      results.overallStatus = COMPLIANCE_STATUS.FAILED;
      results.rejectionReasons.push(cicResult.reason);
      logger.warn(
        `Compliance FAILED at CIC check for loan ${data.loanApplicationId}`
      );
      return results;
    }

    if (cicResult.warnings?.length > 0) {
      results.warnings.push(...cicResult.warnings);
    }

    // 2. Kiểm tra tỷ lệ nợ/thu nhập
    if (data.monthlyIncome) {
      const debtRatioResult = await checkDebtToIncomeRatio(data);
      results.checks.debtRatio = debtRatioResult;

      if (
        !debtRatioResult.passed &&
        debtRatioResult.status === COMPLIANCE_STATUS.FAILED
      ) {
        results.overallStatus = COMPLIANCE_STATUS.FAILED;
        results.rejectionReasons.push(debtRatioResult.reason);
        return results;
      }
    }

    // 3. Kiểm tra số khoản vay đang hoạt động
    const activeLoansResult = await checkActiveLoans(data.userId);
    results.checks.activeLoans = activeLoansResult;

    if (
      !activeLoansResult.passed &&
      activeLoansResult.status === COMPLIANCE_STATUS.FAILED
    ) {
      results.overallStatus = COMPLIANCE_STATUS.FAILED;
      results.rejectionReasons.push(activeLoansResult.reason);
      return results;
    }

    // Xác định trạng thái tổng thể
    const allChecks = Object.values(results.checks);
    const hasReviewRequired = allChecks.some(
      (c) => c.status === COMPLIANCE_STATUS.REVIEW_REQUIRED
    );

    if (hasReviewRequired || results.warnings.length > 0) {
      results.overallStatus = COMPLIANCE_STATUS.REVIEW_REQUIRED;
      logger.info(
        `Compliance REVIEW_REQUIRED for loan ${data.loanApplicationId}`
      );
    } else {
      results.overallStatus = COMPLIANCE_STATUS.PASSED;
      logger.info(`Compliance PASSED for loan ${data.loanApplicationId}`);
    }

    return results;
  } catch (error) {
    logger.error("Full compliance check error:", error);
    results.overallStatus = COMPLIANCE_STATUS.ERROR;
    results.error = { message: error.message };
    return results;
  }
};

// save compliance result to db
const saveComplianceResult = async (loanApplicationId, result) => {
  try {
    const updateData = {
      compliance_checked: 1,
      compliance_check_date: new Date(),
      compliance_status: result.overallStatus,
      compliance_result: JSON.stringify(result),
      updated_date: new Date(),
    };

    // Cập nhật thông tin CIC nếu có
    if (result.checks.cic) {
      updateData.cic_checked = 1;
      updateData.cic_check_date = new Date();
      updateData.cic_transaction_code = result.checks.cic.transactionCode;
      updateData.cic_total_debt = result.checks.cic.details?.totalDebt || 0;
      updateData.cic_has_bad_debt = result.checks.cic.details?.hasBadDebt
        ? 1
        : 0;
      updateData.cic_credit_score = result.checks.cic.details?.creditScore;
      updateData.cic_credit_grade = result.checks.cic.details?.creditGrade;
    }

    await models.loan_application.update(updateData, {
      where: { id: loanApplicationId },
    });

    // Lưu vào compliance_log
    try {
      await models.compliance_log?.create({
        loan_application_id: loanApplicationId,
        user_id: result.userId,
        check_type: "CIC",
        check_date: new Date(),
        overall_status: result.overallStatus,
        cic_status: result.checks.cic?.status,
        cic_transaction_code: result.checks.cic?.transactionCode,
        rejection_reasons: result.rejectionReasons?.join("; "),
        warnings: result.warnings?.join("; "),
        full_result: JSON.stringify(result),
        created_by: "system",
      });
    } catch (e) {
      logger.debug("compliance_log table not found, skipping");
    }

    logger.info(`Saved compliance result for loan ${loanApplicationId}`);
    return { success: true };
  } catch (error) {
    logger.error("Save compliance result error:", error);
    return { success: false, error: error.message };
  }
};

// mask cccd for safe logging
const maskCCCD = (cccd) => {
  if (!cccd) return "N/A";
  if (cccd.length <= 4) return "****";
  return cccd.substring(0, 3) + "****" + cccd.substring(cccd.length - 3);
};

module.exports = {
  // Constants
  COMPLIANCE_STATUS,
  REJECTION_REASONS,
  config,

  // Individual checks
  checkCIC,
  checkDebtToIncomeRatio,
  checkActiveLoans,

  // Full compliance
  runFullComplianceCheck,
  saveComplianceResult,

  // Utils
  maskCCCD,
};
