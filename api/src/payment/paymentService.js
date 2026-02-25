const models = require('../../../models');

//update
exports.update = async (data, id) => {
    return await models.payment.update(data, {
        where: {
            id: id
        }
    })
}