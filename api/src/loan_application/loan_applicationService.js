const models = require('../../../models');
models.loan_application.belongsTo(models.users, { foreignKey: 'user_id' });
models.loan_application.belongsTo(models.borrower_information, { foreignKey: 'borrower_information_id' });
models.borrower_information.belongsTo(models.career, { foreignKey: 'career_id' });
models.career.hasOne(models.borrower_information, { foreignKey: 'career_id' });
models.loan_application.belongsTo(models.loan_information, { foreignKey: 'loan_information_id' });

//create
exports.create = async (data) => {
    return await models.loan_application.create(data)
};

//update
exports.update = async (id, data) => {
    return await models.loan_application.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    })
};

//getAllPaging
exports.getAllPaging = async (data) => {
    let condition = {
        user_id: data.user_id,
        deleted: 0
    };
    return await models.loan_application.findAll({
        where: condition,
        attributes: ["id", "code_transaction", "status", "updated_date", "deleted"],
        include: [{
            model: models.users,
            attributes: ["id", "full_name", "avatar"]
        }, {
            model: models.loan_information,
            attributes: ["time_loan", "loan_amount"]
        }],
        order: [["updated_date", "DESC"]]
    })
};

//getById
exports.getById = async (id) => {
    return models.loan_application.findOne({
        where: {
            id: id
        },
        include: [{
            model: models.users,
            attributes: ["id", "full_name", "avatar"]
        }, {
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
    })
};

//getIdByUserId
exports.getIdByUserId = async (user_id) => {
    return await models.loan_application.findAll({
        where: {
            user_id: user_id,
            status: 4,
            is_pay: 1,
            deleted: 0
        }
    })
}