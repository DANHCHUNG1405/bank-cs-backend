const Minio = require('minio');

let minioClient = new Minio.Client({
    endPoint: 'minio.smiletech.vn',
    port: 443,
    useSSL: true,
    accessKey: 'minio',
    secretKey: 'Smiletech@2022',
});

let bucket = 'smt-bankcs'

module.exports = { minioClient, bucket };
