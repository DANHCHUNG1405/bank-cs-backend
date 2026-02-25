const models = require('../../../models');
models.transaction.belongsTo(models.users, {foreignKey: 'user_id'});
models.transaction.belongsTo(models.loan_application, {foreignKey: 'loan_application_id'});

//getAllPaging
exports.getMyTransaction = async (data) => {
    let condition = { 
        user_id: data.user_id,
        deleted: 0
    };
    return await models.transaction.findAndCountAll({
        where: condition,
        order: [["created_date","DESC"]],
        include: [{
            model: models.loan_application,
            attributes: {exclude: ["created_by", "updated_by"]}
        }]
    });
}