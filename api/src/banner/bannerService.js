const models = require("../../../models");
let {options} = require('../../helper/deleteConstant');

// get All
exports.getAll = async (req) => {
    let condition = {
        deleted: 0
    };
    if (req.type) {
        condition = {
            type: req.type,
            deleted: 0
        }
    }
    return models.banner.findAll({
        where: condition,
    });
};

//getAllPaging
exports.getAllPaging = async (data) => {
    let condition = {
        deleted: 0
    };
    const query = data.query;
    const limit = data.limit;
    const offset = data.offset;
    if (query.type)
        condition.type = query.type;

    return models.banner.findAndCountAll({
        where: condition,
        offset: offset,
        limit: limit
    });
};

// FindById
exports.getById = async (id) => {
    let condition = {
        id: id,
        deleted: 0
    }
    return models.banner.findOne({
        where: condition,
    });
};

// Create
exports.create = async (banner) => {
    return models.banner.create(banner);
};

// Update
exports.update = async (id, banner) => {
    return models.banner.update(banner, {
        where: {
            id: id,
            deleted: 0
        }
    });
}

// Deleted fake
exports.delete = async (id) => {
    return models.banner.update(options, {
        where: {
            id: id,
            deleted: 0
        }
    });
};

