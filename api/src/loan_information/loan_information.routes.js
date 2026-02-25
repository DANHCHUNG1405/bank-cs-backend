const express = require('express');
const router = express.Router();
const loan_informationcontroller = require('./loan_informationController');
const {checkAccessToken, checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.USER]), loan_informationcontroller.create);
router.put('/:id', checkRole([roles.USER]), loan_informationcontroller.update);
router.get('/interest_rate', loan_informationcontroller.getInterestRate);
module.exports = router;