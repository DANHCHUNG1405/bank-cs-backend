const express = require('express');
const router = express.Router();
const addressController = require('./addressController');
const {checkRole} = require('../../middlewares/jwt_token');

router.post('/',checkRole([]) , addressController.create);
router.put('/:id', checkRole([]), addressController.update);
router.delete('/:id', checkRole([]), addressController.delete);
router.get('/get-all', checkRole([]), addressController.getAll);
router.get('/all-paging', checkRole([]), addressController.allPaging);
router.get('/ward', addressController.getWard);
router.get('/district', addressController.getDistrict);
router.get('/province', addressController.getProvince);

module.exports = router;
