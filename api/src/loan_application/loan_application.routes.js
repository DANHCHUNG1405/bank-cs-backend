// loan application routes

const express = require("express");
const router = express.Router();
const loan_applicationController = require("./loan_applicationController");
const { checkRole } = require("../../middlewares/jwt_token");
const roles = require("../../helper/roles");

router.get(
  "/all_paging",
  checkRole([roles.INVESTORS, roles.ADMIN_BANK]),
  loan_applicationController.getAllPAging
);
router.get(
  "/my_loan_application",
  checkRole([roles.USER]),
  loan_applicationController.getMyLoanApplication
);
router.get(
  "/get_by_id/:id",
  checkRole([roles.USER, roles.ADMIN_BANK, roles.INVESTORS]),
  loan_applicationController.getById
);
router.get(
  "/loan/due_this_month",
  checkRole([roles.USER]),
  loan_applicationController.dueThisMonth
);
router.put(
  "/accept_loan_application/loan_application_id",
  checkRole([roles.ADMIN_BANK, roles.INVESTORS]),
  loan_applicationController.acceptLoanApplication
);
router.delete(
  "/cancer_loan_application/:id",
  checkRole([roles.USER]),
  loan_applicationController.cancerLoanApplication
);

// compliance apis (steps 6-9)
// submit loan with cic/pep/sdn/blacklist check
router.post(
  "/submit/:id",
  checkRole([roles.USER]),
  loan_applicationController.submitLoanApplication
);

// get compliance check result
router.get(
  "/compliance/:id",
  checkRole([roles.USER, roles.ADMIN_BANK, roles.INVESTORS]),
  loan_applicationController.getComplianceResult
);

// admin: recheck cic
router.post(
  "/recheck-cic/:id",
  checkRole([roles.ADMIN_BANK]),
  loan_applicationController.recheckCIC
);

module.exports = router;
