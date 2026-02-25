function image_response(data) {
    return data.split(';').map((url, i) => {
        return {
            id: i + 1,
            url: encodeURI(url)
        }
    });
}

module.exports = { image_response };