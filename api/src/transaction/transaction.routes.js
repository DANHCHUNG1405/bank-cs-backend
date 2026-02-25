const express = require('express');
const router = express.Router();
const transactionController = require('./transactionController');
const {checkAccessToken, checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/check_out', checkRole([roles.USER]), transactionController.checkOut);
router.get('/get_my_transaction', checkRole([roles.USER]), transactionController.getMyTransaction);

module.exports = router;