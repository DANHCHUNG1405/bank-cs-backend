const Joi = require("joi");
const { OnePayDomestic, OnePayInternational } = require('vn-payments');
const config = require('../../../config/config.json');
const { generateCode, generateCodeTransactionId } = require('../../helper/generateCode')

const onepaySchema = Joi.object({
    accessCode: Joi.string()
        .required(),
    merchant: Joi.string()
        .required(),
    secureSecret: Joi.string()
        .required(),
    paymentGateway: Joi.string()
        .required(),
})

const onepayInt = new OnePayInternational(config.onepay.international);

const onepayDom = new OnePayDomestic(config.onepay.domestic);

class Onepay {
    constructor(onepay) {
        const { error } = onepaySchema.validate(onepay);
        if (error) {
            throw error;
        }
        Object.assign(this.onepay);
    }
}

const orderSchema = Joi.object({
    amount: Joi.number()
        .required(),
    customerId: Joi.string()
        .required(),
})

class Order {
    constructor(order) {
        const { error } = orderSchema.validate(order);
        if (error) {
            throw error;
        }
        Object.assign(this, order);
    }
}

const transactionSchema = Joi.object({
    vpcVersion: Joi.number()
        .required(),
    currency: Joi.string()
        .required(),
    vpcCommand: Joi.string()
        .required(),
    locale: Joi.string()
        .required(),
    transactionId: Joi.string()
        .required(),
    order_id: Joi.string()
        .required(),
    amount: Joi.string()
        .required(),
    clientIp: Joi.string()
        .required(),
    user_id: Joi.string()
        .required(),
});

class Transaction {
    /**
     * 
     * @param {Order} order 
     * @param {Onepay} onepay 
     * @param {String} clientIp
     */
    constructor(order, clientIp, againLink) {
        const now = new Date();
        this.vpcVersion = '2';
        this.currency = 'VND';
        this.locale = 'vn';
        this.vpcCommand = 'pay';
        this.transactionId = generateCodeTransactionId(3, order);
        this.orderId = order.id;
        this.amount = order.amount;
        this.customerId = order.user_id;
        this.clientIp = clientIp;
        this.againLink = againLink;
        var { error } = transactionSchema.validate();
        if (error) {
            throw error;
        }
    }

    get transactionData() {
        var data = {};
        Object.assign(data, this);
        return data;
    }
    createTransactionURL(transactionType, againLink) {
        switch (transactionType) {
            case 'domestic':
                this.returnUrl = `${againLink}onepay/domestic/callback`;
                return onepayDom.buildCheckoutUrl(this.transactionData);
            case 'international':
                this.returnUrl = `${againLink}onepay/international/callback`;
                return onepayInt.buildCheckoutUrl(this.transactionData);
            default:
                break;
        }
    }

    createTransactionURLV2(transactionTypeV2, againLink) {
        let link;
        if (this.transactionData.returnUrl == 4) {
            link = 4
        }
        if (this.transactionData.returnUrl == 0) {
            link = 0
        }
        switch (transactionTypeV2) {
            case 'domestic':
                this.returnUrl = `${againLink}
                /one_pay/domestic/callback?type=${link}`;
                return onepayDom.buildCheckoutUrl(this.transactionData);
            case 'international':
                this.returnUrl = `${againLink}
                /one_pay/international/callback?type=${link}`;
                return onepayInt.buildCheckoutUrl(this.transactionData);
            default:
                break;
        }
    }
}
/**
 * 
 * @param {*} query 
 * @param {*} transactionType 
 * @returns 
 */
function validateReturnURL(query, transactionType) {
    switch (transactionType) {
        case 'domestic':
            return onepayDom.verifyReturnUrl(query);
        case 'international':
            return onepayInt.verifyReturnUrl(query);
        default:
            break;
    }
}

module.exports = { Transaction, validateReturnURL }
