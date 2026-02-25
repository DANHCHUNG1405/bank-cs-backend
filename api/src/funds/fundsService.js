const models = require('../../../models');
const { Op, where } = require("sequelize");
const { ErrorCodes } = require('../../helper/constants');
const messageConstants = require("../../constant/messageConstants");
var {
    options
} = require('../../helper/deleteConstant');

models.funds.belongsTo(models.users, { foreignKey: 'user_id' });
models.funds.belongsTo(models.investors, { foreignKey: 'investors_id' });
models.funds.belongsTo(models.loan_application, { foreignKey: 'loan_application_id' });
models.funds.belongsTo(models.loan_packages, { foreignKey: 'loan_package_id' });

models.loan_application.belongsTo(models.borrower_information, { foreignKey: 'borrower_information_id' });
models.borrower_information.belongsTo(models.career, { foreignKey: 'career_id' });
models.career.hasOne(models.borrower_information, { foreignKey: 'career_id' });
models.loan_application.belongsTo(models.loan_information, { foreignKey: 'loan_information_id' });


//create
exports.create = async (data) => {
    if (data.type == 1) {
        return models.funds.create(data);
    } else {
        const check = await models.funds.findOne({
            where: {
                user_id: data.user_id,
                investors_id: data.investors_id,
                loan_application_id: data.loan_application_id,
                type: 2,
                deleted: 0,
            }
        })
        if (check) {
            return Promise.resolve({ status: ErrorCodes.ERROR_CODE_ITEM_EXIST, message: messageConstants.INVESTORS_EXIST });
        } else {
            return models.funds.create(data);
        }
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
    return models.funds.findAndCountAll({
        limit: limit,
        offset: offset,
        where: condition,
        attributes: { exclude: ['user_id', 'investors_id'] },
        include: [
            {
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            },
            {
                model: models.investors,
                attributes: ["id", "full_name"]
            },
            {
                model: models.loan_packages,
                attributes: ["id", "interest_rate", "time_loan", "loan_amount", "payment_per_period", "total_payment", "total_profit"]
            }
        ],
    });
};


//getById
exports.getById = async (id) => {
    return await models.funds.findOne({
        where: {
            id: id,
            deleted: 0
        },
        attributes: { exclude: ['user_id', 'investors_id'] },
        include: [
            {
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            },
            {
                model: models.investors,
                attributes: ["id", "full_name"]
            },
            {
                model: models.loan_application,
                attributes: ["id", "code_transaction", "status", "updated_date", "deleted", "application_date", "end_date", "is_pay"],
                include: [{
                    model: models.borrower_information,
                    attributes: { exclude: ["updated_by", "created_by"] },
                    include: [{
                        model: models.career,
                        attributes: ["id", "name"]
                    }]
                }, {
                    model: models.loan_information,
                    attributes: ["id", "user_id", "time_loan", "loan_amount", "total_profit", "total_payment", "payment_per_period"]
                }]
            },
            {
                model: models.loan_packages,
                attributes: ["id", "interest_rate", "time_loan", "loan_amount", "payment_per_period", "total_payment", "total_profit"]
            }
        ],
    })
};

//getById
exports.getFundsByUser = async (data) => {
    limit = data.limit;
    offset = data.offset;
    let condition = {
        user_id: data.user_id,
        deleted: 0
    };
    return await models.funds.findAndCountAll({
        where: condition,
        attributes: { exclude: ['user_id', 'investors_id'] },
        include: [
            {
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            },
            {
                model: models.investors,
                attributes: ["id", "full_name"]
            }
        ],
    })
};

exports.getFundsByInvestors = async (data) => {
    limit = data.limit;
    offset = data.offset;
    let condition = {
        investors_id: data.investors_id,
        deleted: 0,
    }
    let condition2 = {
        deleted: 0,
    }
    if (data.query.type) {
        condition.type = data.query.type;
    }
    if (data.query.status) {
        condition2.status = data.query.status;
    }
    return await models.funds.findAndCountAll({
        where: condition,
        attributes: { exclude: ['user_id', 'investors_id'] },
        include: [
            {
                model: models.users,
                attributes: ["id", "full_name", "avatar"]
            },
            {
                model: models.investors,
                attributes: ["id", "full_name"]
            },
            {
                model: models.loan_application,
                where: condition2,
                attributes: ["id", "code_transaction", "status", "updated_date", "deleted", "application_date", "end_date", "is_pay"],
                include: [{
                    model: models.borrower_information,
                    attributes: { exclude: ["updated_by", "created_by"] },
                    include: [{
                        model: models.career,
                        attributes: ["id", "name"]
                    }]
                }, {
                    model: models.loan_information,
                    attributes: ["id", "user_id", "time_loan", "loan_amount", "total_profit", "total_payment", "payment_per_period"]
                }]
            },
            {
                model: models.loan_packages,
                attributes: ["id", "interest_rate", "time_loan", "loan_amount", "payment_per_period", "total_payment", "total_profit"]
            }
        ],
    })
};


// Update
exports.update = async (id, data) => {
    return models.funds.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    });
};

// Deleted fake
exports.delete = async (id) => {
    return models.funds.update(options, {
        where: {
            id: id,
            deleted: 0
        }
    });
};