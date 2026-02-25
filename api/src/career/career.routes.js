const express = require('express');
const router = express.Router();
const careerController = require('./careerController');
const {checkAccessToken, checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.ADMIN]), careerController.create);
router.put('/:id', checkRole([roles.ADMIN]), careerController.update);
router.get('/', checkRole([]), careerController.getAll);
router.post('/bulk-create', checkRole([roles.ADMIN]), careerController.Bulkcreate);
router.delete('/:id', checkRole([roles.ADMIN]), careerController.delete);

module.exports = router;