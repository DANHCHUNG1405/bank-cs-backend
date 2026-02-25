const models = require('../../../models');
const { Op } = require("sequelize");
const { ErrorCodes } = require('../../helper/constants');
const messageConstants = require("../../constant/messageConstants");
var {
    options
} = require('../../helper/deleteConstant');

models.loan_packages.belongsTo(models.investors, { foreignKey: 'investor_id' });


//create
exports.create = async (data) => {
    return models.loan_packages.create(data);
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
    return models.loan_packages.findAndCountAll({
        limit: limit,
        offset: offset,
        where: condition,
        attributes: { exclude: ['investor_id'] },
        include: [
            {
                model: models.investors,
                attributes: ["id", "full_name"]
            }
        ],
    });
};


//getById
exports.getById = async (id) => {
    return await models.loan_packages.findOne({
        where: {
            id: id,
            deleted: 0
        },
        attributes: { exclude: ['investor_id'] },
        include: [
            {
                model: models.investors,
                attributes: ["id", "full_name"]
            }
        ],
    })
};

//getById
exports.getMyLoanPackages = async (data) => {
    limit = data.limit;
    offset = data.offset;
    let condition = {
        investor_id: data.investor_id,
        deleted: 0
    };
    return await models.loan_packages.findAndCountAll({
        where: condition,
        limit: limit,
        offset: offset,
        attributes: { exclude: ['investor_id'] },
        include: [
            {
                model: models.investors,
                attributes: ["id", "full_name"]
            }
        ],
    })
};


// Update
exports.update = async (id, data) => {
    return models.loan_packages.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    });
};

//updateByCOndition
exports.updateByCondition = async (data, condition) => {
    return models.loan_packages.update(data, { where: condition })
}

// Deleted fake
exports.delete = async (id) => {
    return models.loan_packages.update(options, {
        where: {
            id: id,
            deleted: 0
        }
    });
};