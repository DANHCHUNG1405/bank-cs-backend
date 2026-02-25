const models = require('../../../models');
const { Op } = require("sequelize");
const { ErrorCodes } = require('../../helper/constants');
const messageConstants = require("../../constant/messageConstants");
var {
    options
} = require('../../helper/deleteConstant');

models.investors.belongsTo(models.users, { foreignKey: 'user_id' });


//create
exports.create = async (data) => {
    const check = await models.investors.findOne({
        where: {
            user_id: data.user_id,
            deleted: 0,
        }
    })
    if (check) {
        return Promise.resolve({ status: ErrorCodes.ERROR_CODE_ITEM_EXIST, message: messageConstants.INVESTORS_EXIST });
    } else {
        return models.investors.create(data);
    }
};

// Find All
exports.getAllPaging = (data) => {
    limit = data.limit;
    offset = data.offset;
    let condition = {
        deleted: 0
    };
    condition = {
        deleted: 0,
    }
    if (data.query.status) {
        condition.status = data.query.status
    }
    return models.investors.findAndCountAll({
        limit: limit,
        offset: offset,
        where: condition,
        attributes: { exclude: ['user_id'] },
        include: [
            {
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            }
        ],
    });
};


//getById
exports.getById = async (id) => {
    return await models.investors.findOne({
        where: {
            id: id,
            deleted: 0
        },
        attributes: { exclude: ['user_id'] },
        include: [
            {
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            }
        ],
    })
};

//getById
exports.getMyInvestors = async (user_id) => {
    return await models.investors.findOne({
        where: {
            user_id: user_id,
            deleted: 0
        },
        attributes: { exclude: ['user_id'] },
        include: [
            {
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            }
        ],
    })
};


// Update
exports.update = async (id, data) => {
    return models.investors.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    });
};

//updateByCOndition
exports.updateByCondition = async (data, condition) => {
    return models.investors.update(data, { where: condition })
}

// Deleted fake
exports.delete = async (id) => {
    return models.investors.update(options, {
        where: {
            id: id,
            deleted: 0
        }
    });
};