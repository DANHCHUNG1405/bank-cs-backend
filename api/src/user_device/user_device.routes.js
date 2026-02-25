const express = require("express");
const router = express.Router();
const userDeviceController = require("./user_deviceController");
const { checkAccessToken, checkAdmin } = require('../../middlewares/jwt_token');

router.get("/", checkAccessToken, userDeviceController.getAll);
router.get("/all-paging", userDeviceController.getAllPaging);
router.post("/", checkAccessToken, userDeviceController.create);
router.delete("/delete/:id",checkAccessToken, userDeviceController.destroy);

module.exports = router;