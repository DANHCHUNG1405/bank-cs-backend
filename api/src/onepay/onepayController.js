const { Transaction, validateReturnURL } = require('./onepayService');
const requestIp = require('request-ip');
const models = require('../../../models');
const config = require('../../../config/config.json')
const paymentService = require('../payment/paymentService');

//checkOut
exports.checkout = async (req, res) => {
    const { order, transactionType } = req.body;
    var clientIp =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if (clientIp.length > 15) {
        clientIp = '127.0.0.1';
    }
    let payment = await models.payment.findOne({
        where: { 
            id: order.id
        },
        include: [{
            model: models.loan_application,
            attributes: ["id"],
            include: [{
                model: models.loan_information,
                attributes: ["payment_per_period"]
            }]
        }]
    });
    let data2 = { 
        id: order.id.toString(),
        amount : payment.loan_application.loan_information.payment_per_period,
        user_id: payment.user_id.toString()
    };
    const againLink = config.host.url;
    const transaction = new Transaction(data2, clientIp, againLink);
    const Id_order = parseInt(transaction.orderId);
    const data = {
        payment_code: transaction.transactionId
    }
    if (transaction) {
        await paymentService.update(data, Id_order)
    }
    var url = null;
    try {
        url = await transaction.createTransactionURLV2(transactionType, againLink);
        return res.json({ url, clientIp });
    } catch (error) {
        return res.send(error);
    }
}


//callback
exports.callback = (req, res) => {
    const transactionType = req.params.gateway;
    const query = req.query;
    validateReturnURL(query, transactionType).then(result => {
        if (result.isSuccess) {
            res.json({
                success: true,
            });
        } else {
            res.json({
                success: false,
            });
        }
    })
}


