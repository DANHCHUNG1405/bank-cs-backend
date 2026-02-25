const express = require('express');
const router = express.Router();
const orderController = require('./orderController');
const {checkRole} = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.USER]), orderController.create);
router.put('/accept_order/:order_id', checkRole([roles.ADMIN_BANK]), orderController.acceptOrder);
router.get('/my_order', checkRole([roles.USER]), orderController.getMyOrder);
router.get('/order_detail/:id', checkRole([roles.USER, roles.ADMIN_BANK]), orderController.getById);
router.delete('/delete_order/:id', checkRole([roles.USER],[roles.ADMIN_BANK]), orderController.delete);
router.get('/all_paging', checkRole([roles.ADMIN_BANK]), orderController.getAllPaging);

module.exports = router;