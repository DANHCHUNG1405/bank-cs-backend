const models = require('../../../models');
const logger = require('../../../winston');
const { responseSuccess, responseWithError } = require('../../helper/messageResponse');

//create
exports.create = async (req, res) => {
    try {
        let data = {
            user_id: req.user.id,
            name_bank: req.body.name_bank
        };
        let result = await models.bank.create(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('create bank', error);
        res.json(responseWithError(error));
    }
};

//createArray
exports.createArray = async (req, res) => {
    try {
        let data = await Promise.all(req.body.bank.map(async ele => {
            const bank = { 
                user_id: req.user.id,
                name_bank: ele.name_bank
            };
            return bank;
        }));
        let result = await models.bank.bulkCreate(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('createArray bank', error);
        res.json(responseWithError(error));
    }
};

//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        let data = { 
            namne_bank : req.body.name_bank
        };
        await models.bank.update(data, {
            where: {
                id: id,
                deleted: 0
            }
        });
        res.json(responseSuccess());
    } catch (error) {
        logger.error('update bank', error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        let id = req.params.id;
        await models.bank.update({deleted: 1}, {where: {id: id, deleted: 0}});
        res.json(responseSuccess());
    } catch (error) {
        logger.error('delete bank', error);
        res.json(responseWithError(error));
    }
};

//getAll
exports.getAll = async (req, res) => {
    try {
        let data = await models.bank.findAll({
            where: {
                deleted: 0
            }
        });
        res.json(responseSuccess(data));
    } catch (error) {
        logger.error('getAll bank', error);
        res.json(responseWithError(error));
    }
};