const models = require("../../../models");

//create
exports.create = async (data) => {
    return await models.point_credit.create(data);
};

//update
exports.update = async (id, data) => {
    return await models.point_credit.update(data, {
        where: { 
            id: id,
            deleted: 0
        }
    })
};

//getById
exports.getById = async (id) => {
    return await models.point_credit.findOne({
        where: { 
            id: id,
            deleted: 0
        }
    })
}

//getAllPaging
exports.getAllPaging = async (data) => {
    let condition =  {
        user_id: data.user_id,
        deleted: 0
    };
    return await models.point.findAll({
        where: condition,
        order: [["created_date", "ASC"]]
    })
}