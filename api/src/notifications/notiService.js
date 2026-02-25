const models = require("../../../models");

// Create
exports.create = (data) => {
    return models.notification.create(data);
};

// get-all-paging
exports.getAllPaging = (data) => {
    let condition = {
        deleted: 0
    };
    return models.notification.findAndCountAll({
        where: condition,
        limit: data.limit,
        offset: data.offset
    });
};

//delete
exports.delete = async (id) => {
    return models.notification.destroy({ where: { id: id, deleted: 0 } });
}

// findById
exports.getById = async (id) => {
    return models.notification.findOne({ where: { id: id, deleted: 0 } });
}

//update 
exports.update = async (id, data) => {
    return models.notification.update(data, { where: { id: id } });
};

//getAllMyNotics
exports.getAllMyNotics = async (data) => {
    let condition = { 
        deleted: 0,
        user_id: data.user_id
    };
    if(data.query.type) { 
        condition.type = data.query.type
    };
    return await models.notification.findAndCountAll({
        where: condition,
        order: [["created_date", "DESC"]],
        limit: data.limit,
        offset: data.offset
    })
};

//read 1 thông báo
exports.read = async (id, options_status) => {
    return models.notification.update(options_status, { where: { id: id, deleted: 0 } });
};

//lấy ra tổng thông báo chưa đọc 
exports.getCountUnreadNotifications = async (user_id) => {
    let condition = {
        user_id: user_id,
        is_read: 0,
        deleted: 0
    };
    return await models.notification.findAll({
        where: condition
    });
};

  