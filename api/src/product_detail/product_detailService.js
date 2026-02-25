const models = require('../../../models');
const {Op} = require('sequelize');
models.product.hasOne(models.product_detail,{foreignKey: 'product_id'});
models.product_detail.belongsTo(models.product, {foreignKey: 'product_id'});

//create
exports.create = async (data) => {
    let product_detail = await models.product_detail.create(data);
    let checkExisting = await models.product_detail.findOne({
        where: {
            id: {[Op.ne]: product_detail.id},
            product_id: product_detail.product_id,
            odo: product_detail.odo,
            type_car: product_detail.type_car,
            location_id: product_detail.location_id,
            status: 1,
            deleted: 0
        }
    });
    if (checkExisting) {
        await models.product_detail.destroy({ where: { id: checkExisting.id } });
    }
    return product_detail;
};

//getById
exports.getById = async (id) => {
    return await models.product_detail.findOne({
        where: {
            id: id,
            deleted: 0
        }
    })
};

//update
exports.update = async (id, data) => {
    return await models.product_detail.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    })
}