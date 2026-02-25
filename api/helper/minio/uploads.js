const { minioClient, bucket } = require('./client');
const { v1 } = require('uuid');

module.exports = async (data) => {
    try {
        data.name = v1();
        await minioClient.putObject(bucket, data.name + '.' + getFileExtension(data.mimetype), data.buffer, { 'Content-Type': data.mimetype });
        let result = {
            name: data.originalname,
            url: "https://minio.smiletech.vn/smt-bank-cs/" + data.name + '.' + getFileExtension(data.mimetype),
            file_type: data.mimetype,
            size: data.size
        };
        function getFileExtension(mimeType) {
            const mimeTypes = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/svg': 'svg', 
                'application/pdf': 'pdf',
                'application/doc': 'doc',
                'application/xls': 'xls',
                'video/mp4': 'mp4',
                'video/mp3': 'mp3'
                // Thêm các loại tệp khác nếu cần
            };
        
            return mimeTypes[mimeType] || 'unknown';
        }
        return result;
    } catch (error) {
        throw error;
    }
}

