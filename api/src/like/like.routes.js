const express = require('express');
const router = express.Router();
const likeController = require('./likeController');
const {checkAccessToken} = require('../../middlewares/jwt_token');

router.post('/', checkAccessToken, likeController.create);
router.get('/list_car', checkAccessToken, likeController.getMyCarLike);

module.exports = router;