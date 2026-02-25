const express = require('express');
const router = express.Router();
const notiController = require('./notiController');
const { checkAccessToken, checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/create', checkAccessToken, notiController.create);
router.get('/all-paging',checkAccessToken, notiController.getAllPaging);
router.get('/:id',checkAccessToken, notiController.getById);
router.delete('/delete/:id',checkAccessToken, notiController.delete);
router.put('/update/:id',checkAccessToken, notiController.update);
router.get('/my/notifications', checkAccessToken, notiController.getAllMyNotics);
router.put('/read/all', checkAccessToken, notiController.readAll);
router.put('/read/:id', checkAccessToken, notiController.read);

module.exports = router;