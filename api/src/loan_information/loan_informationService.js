const models = require('../../../models');
const {Op} = require('sequelize');

//create
exports.create = async (data) => {
    let loan_information = await models.loan_information.create(data);
    let checkExisting = await models.loan_information.findOne({
        where: {
            id: {[Op.ne]: loan_information.id},
            user_id: loan_information.user_id,
            is_check: 0,
            deleted: 0
        }
    });
    if (checkExisting) {
        await models.loan_information.destroy({ where: { id: checkExisting.id } });
    }
    return loan_information;
};

//getById
exports.getById = async (id) => {
    return await models.loan_information.findOne({
        where: {
            id: id,
            deleted: 0
        }
    })
};

//update
exports.update = async(id, data) => {
    return await models.loan_information.update(data, {
        where: { 
            id: id,
            deleted: 0
        }
    })
};

//getIdByUserId
exports.getIdByUserId = async (user_id) => {
    return await models.loan_information.findOne({
        where: {
            user_id: user_id,
            is_check: 0
        },
        order: [["created_date", "DESC"]]
    });
}
