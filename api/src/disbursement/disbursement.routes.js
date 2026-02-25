const express = require("express");
const router = express.Router();
const ctrl = require("./disbursementController");
const { checkRole } = require("../../middlewares/jwt_token");
const roles = require("../../helper/roles");

const adminOnly = [roles.ADMIN, roles.ADMIN_BANK];

// Investor: Tạo yêu cầu giải ngân
router.post("/", checkRole([roles.INVESTORS]), ctrl.create);

// Investor: Xác nhận đã chuyển tiền
router.post(
  "/:disbursementId/investor-transfer",
  checkRole([roles.INVESTORS]),
  ctrl.investorTransfer
);

// Admin: Chuyển tiền cho người vay
router.post(
  "/:disbursementId/transfer-to-borrower",
  checkRole(adminOnly),
  ctrl.transferToBorrower
);

// Borrower: Xác nhận đã nhận tiền
router.post(
  "/:disbursementId/borrower-confirm",
  checkRole([roles.USER]),
  ctrl.borrowerConfirm
);

// Lấy thông tin giải ngân theo khoản vay
router.get(
  "/loan/:loanApplicationId",
  checkRole([roles.USER, roles.INVESTORS, roles.ADMIN, roles.ADMIN_BANK]),
  ctrl.getByLoanApplication
);

// Investor: Lấy danh sách giải ngân của mình
router.get("/my", checkRole([roles.INVESTORS]), ctrl.getMyDisbursements);

// Admin: Lấy tất cả giải ngân
router.get("/all", checkRole(adminOnly), ctrl.getAll);

module.exports = router;
