// complaint routes - handles complaint api routing

const express = require("express");
const router = express.Router();
const ctrl = require("./complaintController");
const { checkRole } = require("../../middlewares/jwt_token");
const roles = require("../../helper/roles");

const allUsers = [roles.USER, roles.ADMIN, roles.ADMIN_BANK, roles.INVESTORS];
const adminOnly = [roles.ADMIN, roles.ADMIN_BANK];

// user: create complaint
router.post("/", checkRole(allUsers), ctrl.create);

// user: get my complaints
router.get("/my", checkRole(allUsers), ctrl.getMyComplaints);

// user: add more info to complaint
router.post("/:complaintId/add-info", checkRole(allUsers), ctrl.addMoreInfo);

// get complaint detail
router.get("/:id", checkRole(allUsers), ctrl.getById);

// admin: get all complaints
router.get("/", checkRole(adminOnly), ctrl.getAll);

// admin: assign complaint to self
router.post("/:complaintId/assign", checkRole(adminOnly), ctrl.assignTo);

// admin: request more info from user
router.post(
  "/:complaintId/request-info",
  checkRole(adminOnly),
  ctrl.requestMoreInfo
);

// admin: resolve complaint
router.post("/:complaintId/resolve", checkRole(adminOnly), ctrl.resolve);

// admin: escalate to higher level
router.post("/:complaintId/escalate", checkRole(adminOnly), ctrl.escalate);

module.exports = router;
