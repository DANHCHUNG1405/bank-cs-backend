const express = require('express');
const router = express.Router();
const paymentController = require('./paymentController');
const {checkAccessToken, checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.USER]), paymentController.create);
router.get('/:id', checkRole([roles.USER]), paymentController.getById);

module.exports = router;