const express = require('express');
const router = express.Router();
const bank_branchController = require('./bank_branchController');
const {checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.ADMIN_BANK]), bank_branchController.create);
router.get('/all_paging', checkRole([]), bank_branchController.getAllPaging);
router.get('/location/nearest', checkRole([]),bank_branchController.getBankLocationNearest);
router.put('/update_infor/:id', checkRole([roles.ADMIN_BANK]), bank_branchController.update);
router.get('/:id', checkRole([]), bank_branchController.getById);
router.put('/accept_status/bank/:id', checkRole([roles.ADMIN]), bank_branchController.accept);

module.exports = router;
