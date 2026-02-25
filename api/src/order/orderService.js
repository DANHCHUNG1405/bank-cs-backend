const models = require('../../../models');
models.order.belongsTo(models.users, {foreignKey: 'user_id'});
models.order.belongsTo(models.product, {foreignKey: 'product_id'});


const {Op} = require('sequelize');

//create
exports.create = async (data) => {
    return await models.order.create(data);
};

//getById 
exports.getById = async (id) => {
    return await models.order.findOne({
        where: {
            id: id, 
            status: 0,
            deleted: 0
        }
    })
};

//update
exports.update = async (id, data) => {
    return await models.order.update(data,{
        where: {
            id: id,
            deleted: 0
        }
    })
};

//getAllPaging
exports.getAllPaging = async (data) => {
    let condition = { 
        user_id: data.user_id
    };
    return await models.order.findAndCountAll({
        where: condition,
        attributes: {exclude:["created_by", "updated_by"]},
        include: [{
            model: models.product,
            attributes: ["id", "name", "price_product", "created_date"]
        },{
            model: models.users,
            attributes: ["id", "full_name"]
        }],
        order: [["created_date", "DESC"]],
        limit: data.limit,
        offset: data.offset
    })
}
