// cic routes - api endpoints for cic integration per nhnn 2970

const express = require("express");
const router = express.Router();
const ctrl = require("./cicController");
const { checkRole } = require("../../middlewares/jwt_token");
const roles = require("../../helper/roles");

const adminOnly = [roles.ADMIN, roles.ADMIN_BANK];

// credit check - must call before loan approval per nhnn 2970

// POST /cic/check - Kiểm tra thông tin tín dụng
router.post("/check", checkRole(adminOnly), ctrl.checkCredit);

// GET /cic/check/:transactionCode - Tra cứu kết quả kiểm tra
router.get("/check/:transactionCode", checkRole(adminOnly), ctrl.lookupCheck);

// instant reports - send after disbursement or loan changes

// POST /cic/report/new-loan - Báo cáo khoản vay mới (sau giải ngân)
router.post("/report/new-loan", checkRole(adminOnly), ctrl.reportNewLoan);

// POST /cic/report/old-loan - Báo cáo biến động khoản vay cũ
router.post("/report/old-loan", checkRole(adminOnly), ctrl.reportOldLoan);

// periodic reports - d1 daily before 23:59, d2 monthly before 10th

// POST /cic/report/periodic - Báo cáo định kỳ D1/D2
router.post("/report/periodic", checkRole(adminOnly), ctrl.reportPeriodic);

// GET /cic/report/:fileName - Tra cứu báo cáo định kỳ
router.get(
  "/report/:fileName",
  checkRole(adminOnly),
  ctrl.lookupPeriodicReport
);

// statistics

// GET /cic/statistics/check - Thống kê kiểm tra
router.get("/statistics/check", checkRole(adminOnly), ctrl.statisticsCheck);

// GET /cic/statistics/instant - Thống kê báo cáo tức thời
router.get("/statistics/instant", checkRole(adminOnly), ctrl.statisticsInstant);

// GET /cic/statistics/periodic - Thống kê báo cáo định kỳ
router.get(
  "/statistics/periodic",
  checkRole(adminOnly),
  ctrl.statisticsPeriodic
);

// internal management

// GET /cic/reports - Danh sách báo cáo đã gửi
router.get("/reports", checkRole(adminOnly), ctrl.getReports);

// POST /cic/retry/:reportId - Retry báo cáo thất bại
router.post("/retry/:reportId", checkRole(adminOnly), ctrl.retryReport);

module.exports = router;
