const express = require('express');
const router = express.Router();
const usersController = require('./userController.js');
const { checkAccessToken, checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.get("/all-paging", checkRole([roles.ADMIN, roles.ADMIN_BANK]), usersController.getAllPaging);
router.get("/search", checkRole([roles.ADMIN, roles.USER]), usersController.search);
router.get("/:id", checkAccessToken, usersController.getById);
router.put("/:id", checkRole([]), usersController.update);
router.post("/register", usersController.register);
router.post("/register-web", usersController.registerWeb);
router.post("/login", usersController.login);
router.post("/send-verification-email", usersController.sendVerify);
router.post("/forgot-pass", usersController.forgetPassword);
router.post('/change-password', checkAccessToken, usersController.changePassword);
router.post('/login-with-google', usersController.loginWithGoogle);
router.post('/login-with-apple', usersController.loginWithApple);
router.post('/check-otp', usersController.checkOTP);
router.post('/refresh-token', usersController.refreshToken);
router.put('/authenticate/user', checkRole([roles.USER]), usersController.authenticate);
router.put('/accept_authenticate/user_id/:id', checkRole([roles.ADMIN]), usersController.acceptAuthenticate);
router.get('/get/my-profile', checkRole([roles.USER]), usersController.getMyProfile);
router.put('/add_infor/:id', usersController.addInfor);
router.post('/verify-otp', usersController.verifyOTP);
router.delete('/delete/user', checkAccessToken, usersController.deleteUser);

module.exports = router;