const models = require('../../../models');
models.borrower_information.belongsTo(models.users, {foreignKey: 'user_id'});
//create
exports.create = async (data) => {
    return models.borrower_information.create(data);
};

//getById
exports.getById = async(id) => {
    return await models.borrower_information.findOne({
        where: { 
            id: id,
            deleted: 0
        },
        
    })
}