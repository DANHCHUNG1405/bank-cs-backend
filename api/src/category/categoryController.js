const models = require('../../../models');
const { responseSuccess, responseWithError } = require('../../helper/messageResponse');
const logger = require('../../../winston');
const { ErrorCodes } = require('../../helper/constants');

//create
exports.create = async (req, res) => {
    try {
        let data = {
            user_id: req.user.id,
            name_brand_car: req.body.name_brand_car,
            type: req.body.type
            //type: 1 - hãng xe 
            //type: 2 - câu hỏi theo chủ đề 
        };
        let result = await models.category.create(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('create category', error);
        res.json(responseWithError(error));
    }
};

//bulkCreate
exports.bulkCreate = async (req, res) => {
    try {
        let data = await Promise.all(req.body.category.map(async ele => {
            const category = { 
                user_id: req.user.id,
                name_brand_car: ele.name_brand_car,
                type: req.body.type
            };
            return category;
        }));
        let result = await models.category.bulkCreate(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('bulkCreate category', error);
        res.json(responseWithError(error));
    }
};

//getAll
exports.getAll = async (req, res) => {
    try {
        let data = await models.category.findAll({
            where: {
                deleted: 0
            }
        });
        if(req.query.type) {
            data = data.filter(d => d.type === parseInt(req.query.type))
        };
        res.json(responseSuccess(data));
    } catch (error) {
        logger.error('getAll category', error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        let id = req.params.id;
        let option =  {
            field: 'deleted',
            deleted: 1
        };
        if(id) {
            let result = await models.category.update(option, {
                where: {
                    id: id,
                    deleted: 0
                }
            });
            res.json(responseSuccess(result));
        }else{
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,'Category không tồn tại!'));
        }
    } catch (error) {
        logger.error('delete category', error);
        res.json(responseWithError(error));
    }
};

//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        let data = {
            name_brand_car: req.body.name_brand_car,
            type: req.body.type
        };
        if(id) {
            await models.category.update(data, {
                where: {
                    id: id,
                    deleted: 0
                }
            });
            res.json(responseSuccess())
        }else{
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,'Category không tồn tại!'));
        }
    } catch (error) {
        logger.error('update category', error);
        res.json(responseWithError(error));
    }
}