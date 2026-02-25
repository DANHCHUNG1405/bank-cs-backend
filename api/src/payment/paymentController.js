const models = require('../../../models');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const paymentService = require('./paymentService');
models.payment.belongsTo(models.loan_application, {foreignKey: 'loan_application_id'});

//create
exports.create = async (req, res) => {
    try {
        let data = { 
            user_id: req.user.id,
            loan_application_id: req.body.loan_application_id,
            payment_method: req.body.payment_method
        };
        let result = await models.payment.create(data);
        res.json(responseSuccess(result.message, 'Tạo yêu cầu thanh toán thành công!'))
    } catch (error) {
        logger.error('create payment', error);
        res.json(responseWithError(error));
    }
};

//getById
exports.getById = async(req, res) => {
    try {
        const id = req.params.id;
        let data = await models.payment.findOne({
            where: { 
                id: id,
                user_id: req.user.id,
                deleted: 0
            },
            include: [{
                model: models.loan_application,
                attributes: ["code_transaction"],
                include: [{
                    model: models.loan_information,
                    attributes: ["time_loan", "payment_per_period"]
                }]
            }],
            attributes: {exclude: ["created_by"]}
        });
        res.json(responseSuccess(data, 'Thông tin thanh toán!'));
    } catch (error) {
        logger.error('getById mypayment', error);
        res.json(responseWithError(error));
    }
}