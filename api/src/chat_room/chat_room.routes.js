const express = require('express');
const router = express.Router();
const chat_roomController = require('./chat_roomController');
const {checkAccessToken} = require('../../middlewares/jwt_token');

router.post('/create_private', checkAccessToken, chat_roomController.create);
router.delete('/delete/:chat_room_id',checkAccessToken, chat_roomController.delete);
router.get('/:id', checkAccessToken, chat_roomController.getById);
router.get('/get/my_chat_room', checkAccessToken, chat_roomController.getAll); //getMyChatRoom
router.put('/is_notification/:chat_room_id', checkAccessToken, chat_roomController.updateNotiStatus);

module.exports = router;