const models = require('../../../models');
models.like.belongsTo(models.users, {foreignKey: 'user_id'});
models.like.belongsTo(models.product, {foreignKey: 'product_id'});

//GetUserId
exports.getUserId = async (user_id) => {
    return await models.like.findAll({
        where: { user_id: user_id }
    });
};

//getProductByUserId 
exports.getProductByUserId = async (data) => {
    let condition = { 
        user_id: data.user_id
    }
    return await models.like.findAndCountAll({
        where: condition,
        include: [{
            model: models.product,
            attributes: {exclude: ["created_by", "updated_by"]},
            where: {deleted: 0},
            include: [{
                model: models.product_detail,
                where: {deleted: 0},
                attributes: {exclude:["created_by", "updated_by"]}
            }]
        }],
        order: [["created_date","DESC"]],
        limit: data.limit,
        offset: data.offset
    })
}