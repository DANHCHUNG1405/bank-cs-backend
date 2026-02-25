const models = require('../../../models');
const { Op } = require("sequelize");
const sequelize_entity = require('../../../models').sequelize;
const QueryTypes = require('sequelize');
models.bank_branch.belongsTo(models.users, {foreignKey: 'user_id'});
models.bank_branch.belongsTo(models.address, {foreignKey: 'address_id'});

//create
exports.create = async (data) => {
    return await models.bank_branch.create(data);
};

//getById 
exports.getById = async (id) => {
    return await models.bank_branch.findOne({
        where: { 
            id: id,
            deleted: 0 ,
            status: 1
        },
        include: [{
            model: models.users,
            attributes: ["id", "full_name", "avatar"]
        },{
            model: models.address,
            attributes: ["id", "address_detail_2"]
        }],
    })
};

//update
exports.update = async (id, data) => {
    return await models.bank_branch.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    })
};

//getAllPaging 
exports.getAllPaging = async (data) => {
    let condition = { 
        deleted: 0
    }
    return await models.bank_branch.findAndCountAll({
        where: condition,
        attributes: {exclude: ["created_by", "updated_by"]},
        limit: data.limit,
        offset: data.offset
    })
};

//getDistanceBankBranch
exports.getDistanceBankBranch = async (lat, lng, distance,limit, offset) => {
    const query = `SELECT id, user_id, name, address_id, lat, lng, deleted, status, (6371 * acos(cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(lat )))) AS distance 
    FROM bank_branches
    HAVING distance < ${distance} 
    ORDER BY distance LIMIT ${offset}, ${limit};`
    const data = await sequelize_entity.query(query.trim(), {
        nest: true,
        type: QueryTypes.SELECT
    });
    return data;
};
