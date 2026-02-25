const express = require('express');
const router = express.Router();
const bannerController = require('./bannerController');
const { checkRole } = require('../../middlewares/jwt_token');
const roles = require('../../helper/roles');

router.get('/all-paging',checkRole([]), bannerController.allPaging);
router.get('/',checkRole([]), bannerController.getAll);
router.get('/:id',checkRole([]), bannerController.getById);
router.post('/',checkRole([roles.ADMIN]),bannerController.create);
router.put('/:id', checkRole([roles.ADMIN]), bannerController.update)
router.delete('/:id', checkRole([roles.ADMIN]), bannerController.softDelete);

module.exports = router;