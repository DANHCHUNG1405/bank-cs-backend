const express = require('express');
const router = express.Router();
const investorsController = require('./investorsController');
const { checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([]), investorsController.create);
router.get('/all-paging', checkRole([]), investorsController.getAllPaging);
router.get('/my', checkRole([]), investorsController.getMyInvestors);
router.get('/:id', checkRole([]), investorsController.getById);
router.put('/:id', checkRole([]), investorsController.update);
router.put('/accept/:id', checkRole([roles.ADMIN]), investorsController.acceptInvestors);
router.delete('/:id', checkRole([]), investorsController.delete);


module.exports = router;