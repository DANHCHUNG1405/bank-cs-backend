const models = require ('../../../models');
models.message.belongsTo(models.users, {foreignKey: 'user_id'});
models.message.belongsTo(models.chat_room, {foreignKey: 'chat_room_id'});
const {Op} = require('sequelize');

//crate message
exports.create = async (message) => {
    return await models.message.create(message);
};

//delete
exports.softDelete = async(id) => {
    let option = { 
        field: 'deleted',
        deleted: 1
    };
    return models.message.update(option ,{
        where: {
            id: id,
            deleted: 0
        }
    })
};

//update
exports.update = async(data,condition) => {
    return await models.message.update(data, {where:condition})
}

//Xoá toàn bộ bản ghi khỏi database khi nhóm chat bị xoá
exports.delete = async (condition) => {
    return await models.message.destroy({
        where: condition
    })
}

//getByIdForChatRoom
exports.getByIdForChatRoom = async (data) => { 
    return await models.message.findOne({
        where: data,
        attributes: ["id", "content", "status", "created_date", "image_url", "document_file"],
        include: [{
            model: models.chat_room,
            attributes: ["id", "sender", "receiver", "created_date"]
        }]
    })
};

//GetById
exports.getById = async (id) => {
    return await models.message.findOne({
        where: {
            id: id,
            deleted: 0
        },
        attributes: ["id", "content", "user_id", "chat_room_id", "image_url", "viewed_by"],
        include: [{
            model: models.users,
            attributes: ["full_name"]
        }]
    })
};

//search
exports.search = async (data) => {
    let condition = {
        deleted: 0
    };
    if(data.query.chat_room_id) {
        condition.chat_room_id = data.query.chat_room_id
    };
    
    return await models.message.findAll({
        where: condition,
        include: [{
            model: models.users,
            attributes: ["id", "full_name", "avatar", "is_online"]
        }],
        order: [["created_date", "DESC"]],
        limit: data.limit,
        offset: data.offset
    })
}

