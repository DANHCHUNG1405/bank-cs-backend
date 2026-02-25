const express = require('express');
const router = express.Router();
const productController = require('./productController');
const {checkRole} = require('../../middlewares/jwt_token');
const roles = require("../../helper/roles");

router.post('/', checkRole([roles.ADMIN_BANK]), productController.create);
router.get('/product_detail/:id', checkRole([]), productController.getById);
router.delete('/delete_product/:id', checkRole([roles.ADMIN_BANK]), productController.delete);
router.put('/update_product/:id', checkRole([roles.ADMIN_BANK]), productController.update);
router.get('/get_product/all_paging', checkRole([]), productController.getAllPaging);

module.exports = router;