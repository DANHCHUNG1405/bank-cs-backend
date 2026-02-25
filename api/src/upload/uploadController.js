const UploadService = require("./uploadService");
const { ErrorCodes } = require('../../helper/constants');
const upload = require("../../middlewares/uploads/upload");
const uploads = require("../../middlewares/uploads/uploads");
const fs = require('fs');
const { responseSuccess, responseWithError } = require("../../helper/messageResponse");
const upload_minio = require('../../helper/minio/uploads');

// Upload
exports.uploadSingle = async (req, res) => {
    try {
        await upload(req, res);
        UploadService.uploadSingle(req, req.headers.host).then(data => {
            res.json(responseSuccess({
                url: data
            }));
        }).catch((err) => {
            res.send({
                error: {
                    status: err.status || 500,
                    message: err.message
                }
            });
        });
    } catch (err) {
        res.json(responseWithError(err.status, 'error', err.message || ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};


// Uploads
exports.uploadArray = async (req, res) => {
    await uploads(req, res);
    UploadService.uploadArray(req).then(data => {
        res.json(responseSuccess({
            url: data
        }));
    }).catch((err) => {
        res.send({
            error: {
                status: err.status || 500,
                message: err.message
            }
        });
    });
};

//uploadSingleMinio
exports.uploadSingleMinio = async (req, res, next) => {
    try {
        let file = req.file;
        file.name = file.originalname;
        let data = await upload_minio(file);
        res.json(responseSuccess(data))
    } catch (error) {
        res.json(responseWithError(error));
    }
};

//uploadArrayMinio
exports.uploadArrayMinio = async (req, res) => {
    try {
        let result = [];
        await Promise.all(req.files.map(async (ele, index) => {
            let file = ele;
            file.name = file.originalname;
            let data = await upload_minio(file);
            result.push(data);
        }))
        res.json(responseSuccess(result))
    } catch (error) {
        res.json(responseWithError(error));
    }

}

