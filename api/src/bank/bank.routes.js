const express = require('express');
const router = express.Router();
const bankController = require('./bankController');
const {checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.ADMIN]), bankController.create);
router.post('/bulkCreate', checkRole([roles.ADMIN]), bankController.createArray);
router.put('/:id', checkRole([roles.ADMIN]), bankController.update);
router.delete('/:id', checkRole([roles.ADMIN]), bankController.delete);
router.get('/', checkRole([]), bankController.getAll);
module.exports = router;
