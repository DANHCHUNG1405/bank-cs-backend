const models = require('../../../models');
const { responseSuccess, responseWithError } = require('../../helper/messageResponse');
const logger = require('../../../winston');

//create
exports.create = async (req, res) => {
    try {
        let data = {
            user_id: req.user.id,
            name: req.body.name
        };
        let result = await models.career.create(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('create career', error);
        res.json(responseWithError(error));
    }
};

//Bulkcreate
exports.Bulkcreate = async (req, res) => {
    try {
        let data = await Promise.all(req.body.career.map(async ele => {
            const career = {
                user_id: req.user.id,
                name: ele.name
            };
            return career;
        }));
        let result = await models.career.bulkCreate(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('Bulkcreate career', error);
        res.json(responseWithError(error));
    }
};

//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        let data = { 
            name: req.body.name
        }
        await models.career.update({name: data.name, updated_date: new Date()}, {where: {id: id,deleted: 0}});
        res.json(responseSuccess())
    } catch (error) {
        logger.error('update career', error);
        res.json(responseWithError(error));
    }
};

//getAll
exports.getAll = async (req, res) => {
    try {
        let data = await models.career.findAll({
            where: {
                deleted: 0
            }
        });
        res.json(responseSuccess(data));
    } catch (error) {
        logger.error('getAll career', error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        let id = req.params.id;
        let data = await models.career.destroy(id);
        res.json(responseSuccess(data));
    } catch (error) {
        logger.error('delete career', error);
        res.json(responseWithError(error));
    }
}



