const express = require('express');
const router = express.Router();
const unlikeController = require('./unlikeController');
const {checkAccessToken} = require('../../middlewares/jwt_token');

router.post('/', checkAccessToken, unlikeController.create);

module.exports = router;