const models = require('../../../models');
models.message.belongsTo(models.chat_room, { foreignKey: 'chat_room_id' });
models.chat_room.hasMany(models.message, { foreignKey: 'chat_room_id' });
const { Op } = require('sequelize');

//create
exports.createPrivate = async (data) => {
    const { sender, receiver } = data;
    let checkExisting = await models.chat_room.findOne({
        where: {
            [Op.or]: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ],
            status: 1,
            deleted: 0
        }
    });
    if (!checkExisting) {
        return await models.chat_room.create({
            sender: data.sender,
            receiver: data.receiver
        })
    } else {
        return checkExisting;
    }
};

//update
exports.update = async (id, data) => {
    return await models.chat_room.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    })
};


//delete chat 1-1
exports.deletePrivate = async (id) => {
    let option = {
        field: "deleted",
        deleted: 1
    }
    return await models.chat_room.update(option, {
        where: {
            id: id,
            deleted: 0
        }
    })
};

//getById
exports.getById = async (id) => {
    return await models.chat_room.findOne({
        where: {
            id: id,
            deleted: 0,
        },
        include: [{
            model: models.message,
            include: [{
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            }],
            limit:1,
            order: [["created_date", "DESC"]]
        }],
        attributes: ["id", "sender", "receiver", "is_notification_on_sender", "is_notification_on_receiver"],
    })
};

//findAll 
exports.getAll = async (data) => {
    let result = await models.chat_room.findAll({
        where: { 
            [Op.or]: [
                {sender: data.user_id},
                {receiver: data.user_id}
            ],
            deleted: 0,
        },
        attributes: ["id", "sender", "receiver", "is_notification_on_sender", "is_notification_on_receiver", "created_date", "updated_date"],
        include: [{
            model: models.message,
            where: {deleted: 0},
            include: [{
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            }],
            order: [["created_date", "DESC"]],
            limit: 1,
            offset: 0
        }],
        order: [["updated_date", "DESC"]]
    });
    return result;
};
