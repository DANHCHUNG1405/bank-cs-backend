const express = require('express');
const router = express.Router();
const borrower_informationController = require('./borrower_informationController');
const {checkAccessToken, checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.USER]), borrower_informationController.create);
router.put('/update_information/:id', checkRole([roles.USER]), borrower_informationController.updateInformation)

module.exports = router;