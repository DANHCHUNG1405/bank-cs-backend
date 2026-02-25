const util = require("util");
const multer = require('multer');
const fs = require("fs");
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __basedir + "/upload/uploads");
    },
    filename: function (req, files, callback) {
        const new_name = `${files.originalname}`.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/ /g, '_')
            .replace(/[,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        callback(null, Date.now() + '' + `${new_name}`);
    },
});
const upload = multer({ storage: storage }).array("files");
var uploadFilesMiddleware = util.promisify(upload);
module.exports = uploadFilesMiddleware;