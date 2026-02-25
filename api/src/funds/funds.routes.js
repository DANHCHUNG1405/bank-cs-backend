const express = require('express');
const router = express.Router();
const fundsController = require('./fundsController');
const { checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.INVESTORS]), fundsController.create);
router.get('/all-paging', checkRole([]), fundsController.getAllPaging);
router.get('/funds-investors', checkRole([roles.INVESTORS]), fundsController.getFundsByInvestors);
router.get('/funds-user', checkRole([roles.USER]), fundsController.getFundsByUser);
router.get('/:id', checkRole([]), fundsController.getById);
router.put('/:id', checkRole([]), fundsController.update);
router.delete('/:id', checkRole([]), fundsController.delete);


module.exports = router;