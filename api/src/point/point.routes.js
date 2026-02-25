const express = require('express');
const router = express.Router();
const pointController = require('./pointController');
const {checkAccessToken, checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.get('/my_point_credit', checkRole([]), pointController.getMyPointCredit);
router.get('/', checkRole([]), pointController.getAllPaging);

module.exports = router;