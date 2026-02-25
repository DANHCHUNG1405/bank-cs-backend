const express = require('express');
const router = express.Router();
const locationController = require('./locationController');
const {checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.get('/get-all', checkRole([]), locationController.getAll);

module.exports = router;