const models = require("../../../models");
const {Op} = require('sequelize');
models.user_device.belongsTo(models.users, {foreignKey: 'user_id'});

//Create
exports.create = async (device) => {
    let data = await models.user_device.create(device);
    const TokenUserId = await models.user_device.findOne({
        where: {
            id: {[Op.ne]: data.id},
            user_id: data.user_id,
            token_device: data.token_device,
            unique_id: data.unique_id,
            device_name: data.device_name,
            status: 0,
            deleted: 0
        },
    });
    if (TokenUserId) {
        await models.user_device.destroy({where: {id: TokenUserId.id}});
    };
    return data;
    
};

// FindById
exports.getAll = async (data) => {
    let condition = { 
        user_id: data.user_id,
        deleted: 0
    }
    return models.user_device.findAll({
        where: condition
    });
};

// Find All Paging
exports.getallpaging = (searchViewModel) => {
    limit = searchViewModel.limit;
    offset = searchViewModel.offset;
    return models.user_device.findAndCountAll({
        limit: limit,
        offset: offset,
    });
};

//getDeviceByUser
exports.getDeviceByUser = async (user_id) => {
    return await models.user_device.findOne({
        where: {
            user_id: user_id
        },
        order: [["created_date", "ASC"]]
    });
};

// FindById
exports.getbyID = async (id)=> {
    return models.user_device.findOne({ where: { id: id } });
};

// Update
exports.update = async (Id, options) => {
    return models.user_device.update(options, { where: { id: Id } });
};

//  Deleted fake
exports.delete = async (Id, options) => {
    return models.user_device.update(options, { where: { id: Id, deleted: 0 } });
};

// Restore
exports.restore = async (Id, options) => {
    return models.user_device.update(options, { where: { id: Id, deleted: 1 } });
};

//destroy
exports.destroy = async (condition) => {
    return models.user_device.destroy({ where: condition })
}


