const express = require("express");
const router = express.Router();
const questionController = require("./questionController");
const { checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.USER]), questionController.create);
router.get('/:id', checkRole([]), questionController.getById);
router.get('/', checkRole([]), questionController.getAllPaging);
router.delete('/:id', checkRole([roles.ADMIN]), questionController.delete);

module.exports = router;