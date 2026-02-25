// appotapay routes - handles payment api routing

const express = require("express");
const router = express.Router();
const ctrl = require("./appotapayController");
const { checkRole } = require("../../middlewares/jwt_token");
const roles = require("../../helper/roles");

const allUsers = [roles.USER, roles.ADMIN, roles.ADMIN_BANK, roles.INVESTORS];
const adminOnly = [roles.ADMIN, roles.ADMIN_BANK];

// public - callback & return from appotapay
router.post("/callback", ctrl.callback);
router.get("/return", ctrl.returnUrl);
router.get("/banks", ctrl.getBanks);

// protected - payment creation
router.post("/payment", checkRole(allUsers), ctrl.createPayment);
router.post("/qr-payment", checkRole(allUsers), ctrl.createQRPayment);

// protected - disbursement (admin only)
router.post("/disbursement", checkRole(adminOnly), ctrl.createDisbursement);

// disbursement with account verification and auto retry
router.post(
  "/disbursement-with-verify",
  checkRole(adminOnly),
  ctrl.createDisbursementWithVerify
);

// verify bank account before transfer
router.post("/verify-account", checkRole(allUsers), ctrl.verifyBankAccount);

// refund transaction (admin only)
router.post("/refund", checkRole(adminOnly), ctrl.createRefund);

// check system balance (admin only)
router.get("/balance", checkRole(adminOnly), ctrl.checkBalance);

// protected - transaction queries
router.get("/transactions", checkRole(allUsers), ctrl.getTransactions);
router.get(
  "/transaction/:transactionId",
  checkRole(allUsers),
  ctrl.getTransactionDetail
);
router.get(
  "/transaction/:transactionId/status",
  checkRole(allUsers),
  ctrl.checkStatus
);

module.exports = router;
