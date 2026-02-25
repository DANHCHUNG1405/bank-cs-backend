const express = require('express');
const router = express.Router();
const uploadController = require('./uploadController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post('/upload-single', uploadController.uploadSingle);
router.post('/upload-array', uploadController.uploadArray);
router.post('/array-minio', upload.array('files'), uploadController.uploadArrayMinio);
router.post('/single-minio', upload.single('file'), uploadController.uploadSingleMinio);

module.exports = router;