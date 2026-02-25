const express = require("express");
const router = express.Router();
const ctrl = require("./repaymentController");
const { checkRole } = require("../../middlewares/jwt_token");
const roles = require("../../helper/roles");

const allUsers = [roles.USER, roles.ADMIN, roles.ADMIN_BANK, roles.INVESTORS];
const adminOnly = [roles.ADMIN, roles.ADMIN_BANK];

// User: Lấy lịch trả nợ của mình
router.get("/my", checkRole([roles.USER]), ctrl.getMySchedule);

// Lấy lịch trả nợ theo khoản vay
router.get(
  "/loan/:loanApplicationId",
  checkRole(allUsers),
  ctrl.getByLoanApplication
);

// Lấy kỳ thanh toán tiếp theo
router.get(
  "/loan/:loanApplicationId/next",
  checkRole([roles.USER]),
  ctrl.getNextDue
);

// Thanh toán một kỳ
router.post("/pay/:scheduleId", checkRole([roles.USER]), ctrl.payPeriod);

// Tất toán khoản vay
router.post(
  "/settlement/:loanApplicationId",
  checkRole([roles.USER]),
  ctrl.settlement
);

// Admin: Lấy danh sách sắp đến hạn
router.get("/upcoming", checkRole(adminOnly), ctrl.getUpcomingDue);

// Admin: Lấy danh sách quá hạn
router.get("/overdue", checkRole(adminOnly), ctrl.getOverdue);

module.exports = router;
