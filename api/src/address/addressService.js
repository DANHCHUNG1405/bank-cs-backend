const models = require("../../../models");
const messageConstants = require("../../constant/messageConstants");
const { Op } = require("sequelize");
models.address.belongsTo(models.users, { foreignKey: 'user_id' });

//create
exports.create = async (data) => {
    return models.address.create(data);
};

//getAll
exports.getAll = async (data) => {
    let condition={
        deleted:0
    };
    if (data.user_id){
        condition.user_id=data.user_id;
    }
    return models.address.findAll({
        where: condition
    });
}

// update 
exports.update = async (id, data) => {
    let condition = {
        id: id,
        deleted: 0
    }
    return models.address.update(data, { where: condition });
};

//updateByCondition
exports.updateByCondition = async (option, data) => {
    let condition = {
        ...option,
        deleted: 0
    }
    return models.address.update(data, { where: condition });
}

// all paging
exports.getMyAddress = (searchViewModel) => {
    let limit = searchViewModel.limit;
    let offset = searchViewModel.offset;
    let condition = {
        deleted: 0,
        user_id: searchViewModel.user
    };
    return models.address.findAndCountAll({
        where: condition,
        //attributes: ['id', 'phone', 'street', 'unit', 'default', 'address_detail', 'status', 'deleted','name'],
        include: [
            { 
                model: models.users,
                attributes: ['id', 'full_name', 'user_name', 'avatar']
            }
        ],
        limit: limit,
        offset: offset,
        order: [["default", "DESC"]],
    });
};

//delete
exports.delete = async (id, data) => {
    return models.address.update(data, { where: { id: id, deleted: 0 } });
};

//getById
exports.getById = async (id) => {
    return models.address.findOne({ where: { id: id } });
}
