// Upload
exports.uploadSingle = async (req, host) => {
    var url = `/upload/uploads/${
        req.file.filename
    }`;
    return url
};

// Uploads
exports.uploadArray = async (req) => {
    const data= req.files.map(item => {
        var url = `/upload/uploads/${
            item.filename
        }`;
        return url
    });
    return data
};