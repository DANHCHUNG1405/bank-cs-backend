const models = require('../../../models');
const { responseSuccess, responseWithError } = require('../../helper/messageResponse');
const logger = require('../../../winston');

//getAll
exports.getAll = async (req, res) => {
    try {
        let data = await models.location.findAll({
            where: {
                deleted: 0
            }
        });
        res.json(responseSuccess(data));
    } catch (error) {
        logger.error('getAll location', error);
        res.json(responseWithError(error));
    }
}