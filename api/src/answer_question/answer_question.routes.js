const express = require("express");
const router = express.Router();
const answer_questionController = require("./answerController");
const { checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.ADMIN]), answer_questionController.answer);
router.put('/:id', checkRole([roles.ADMIN]), answer_questionController.update);
router.delete('/:id', checkRole([roles.ADMIN]), answer_questionController.delete);

module.exports = router;