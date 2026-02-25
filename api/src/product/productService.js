const models = require('../../../models');
models.product.hasOne(models.product_detail,{foreignKey: 'product_id'});
models.product_detail.belongsTo(models.product, {foreignKey: 'product_id'});
models.product.belongsTo(models.users, {foreignKey: 'user_id'});
models.product.belongsTo(models.category, {foreignKey: 'category_id'});
models.category.hasMany(models.product, {foreignKey: 'category_id'});
models.product_detail.belongsTo(models.location, {foreignKey: 'location_id'});
const likeService = require('../like/likeService');
const {Op} = require('sequelize');

//create
exports.create = async (data) => {
    let product = await models.product.create(data);
    let checkExisting = await models.product.findOne({
        where: {
            id: {[Op.ne]: product.id},
            user_id: product.user_id,
            category_id: product.category_id,
            name: product.name,
            image_url: product.image_url,
            description: product.description,
            price_product: product.price_product,
            type: product.type,
            status: 1,
            deleted: 0
        }
    });
    if (checkExisting) {
        await models.product.destroy({ where: { id: checkExisting.id } });
    }
    return product;
};

//getById
exports.getById = async (id) => {
    return await models.product.findOne({
        where: {
            id: id,
            deleted: 0
        },
        include: [{
            model: models.users,
            attributes: ["id", "full_name", "avatar", "phone", "address_id"],
            include: [{
                model: models.address,
                attributes: ["id", "address_detail_2"]
            }]
        },{
            model: models.product_detail,
            where: {
                deleted: 0
            },
            attributes: {exclude: ["updated_by", "created_by"]},
            include: [{
                model: models.location,
                attributes: ["id", "name_province"]
            }]
        },{
            model: models.category,
            attributes: ["id", "name_brand_car"]
        }],
        attributes: {exclude: ["updated_by", "created_by"]}
    })
};

//delete
exports.delete = async (id) => {
    let option = {
        field: 'deleted',
        deleted: 1
    };
    return await models.product.update(option, {
        where: {
            id: id,
            deleted: 0
        }
    })
};

//update
exports.update = async (id, data) => {
    return await models.product.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    })
};

//getAllPaging 
exports.getAll = async () => {
    return await models.product.findAll({
        where: {deleted: 0},
        include: [{
            model: models.product_detail,
            where: { 
                deleted: 0
            },
            attributes: ["id", "odo", "type_car", "year_manufacture", "location_id"],
            include: [{
                model: models.location,
                attributes: ["id", "name_province"]
            }]
        },{
            model: models.category,
            attributes: ["id", "name_brand_car", "image_url"]
        }],
        attributes: ["id", "name", "price_product", "image_url", "type", "total_like", "is_available"],
        order: [["created_date", "DESC"]]
    })
};

