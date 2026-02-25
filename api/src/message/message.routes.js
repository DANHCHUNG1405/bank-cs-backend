const express = require('express');
const { checkAccessToken } = require('../../middlewares/jwt_token');
const router = express.Router();
const messageController = require('./messageController');

router.post('/', checkAccessToken, messageController.create);
router.get('/get-messages', checkAccessToken, messageController.getMessages);
router.delete('/delete-message/:id',checkAccessToken, messageController.delete);
router.put('/seen-message', checkAccessToken, messageController.viewMessage);

module.exports = router;