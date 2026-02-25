const express = require('express');
const router = express.Router();
const categoryController = require('./categoryController');
const {checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.ADMIN]), categoryController.create);
router.post('/bulk-create', checkRole([roles.ADMIN]), categoryController.bulkCreate);
router.put('/:id', checkRole([roles.ADMIN]), categoryController.update);
router.delete('/:id', checkRole([roles.ADMIN]), categoryController.delete);
router.get('/', checkRole([]), categoryController.getAll);

module.exports = router;