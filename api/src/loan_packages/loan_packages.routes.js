const express = require('express');
const router = express.Router();
const loanPackagesController = require('./loan_packagesController');
const { checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.post('/', checkRole([roles.INVESTORS]), loanPackagesController.create);
router.get('/all-paging', checkRole([]), loanPackagesController.getAllPaging);
router.get('/my', checkRole([roles.INVESTORS]), loanPackagesController.getMyLoanPackage);
router.get('/:id', checkRole([]), loanPackagesController.getById);
router.put('/:id', checkRole([]), loanPackagesController.update);
router.delete('/:id', checkRole([]), loanPackagesController.delete);


module.exports = router;