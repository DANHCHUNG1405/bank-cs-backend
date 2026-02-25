const loan_inforamtionService = require('./loan_informationService');
const models = require('../../../models');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const logger = require('../../../winston');
const { ErrorCodes } = require('../../helper/constants');
const {Op} = require('sequelize');

//create
exports.create = async (req, res) => {
    try {
        const data = {
            user_id: req.user.id,
            loan_amount: req.body.loan_amount,
            time_loan: req.body.time_loan, 
            type: req.body.type
        };
        if(data.type == 1) {
            let loan_application = await models.loan_application.findAll({
                where: {
                    user_id: req.user.id,
                    deleted: 0
                }
            });
            let a = true;
            loan_application.map(async (ele) => {
                if(ele.status == 0 || ele.status == 1 || ele.status == 2 || ele.status == 4) {
                    a = false;
                };
                return ele;
            });
            if(a == true) {
                const result = await loan_inforamtionService.create(data);
                const loan_infor_detail = await loan_inforamtionService.getById(result.id);
                const total_profit = result.loan_amount * loan_infor_detail.interest_rate * result.time_loan;
                const payment_per_period = (result.loan_amount + total_profit) / result.time_loan;
                await models.loan_information.update({
                    total_profit: total_profit,
                    payment_per_period: payment_per_period,
                    total_payment: result.loan_amount + total_profit
                }, {
                    where: { id: result.id, deleted: 0 }
                });
                const updatedLoanInfo = await models.loan_information.findOne({
                    where: { id: result.id, deleted: 0, is_check: 0 },
                    attributes: {exclude: ["created_by", "updated_date"]}
                });
                return res.json(responseSuccess({
                    message: 'Số tiền yêu cầu vay được tạo thành công!',
                    updatedLoanInfo
                }));
            }else{
                res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_EXIST,'Ban đang có một hồ sơ đang trong quá trình xét duyệt và trả. Không thể tạo đơn vay mới đến khi bạn tất toán khoản vay!'));
            }
        }else if (data.type == 2) {
            const user = await models.users.findOne({
                where: {
                    id: req.user.id
                }
            });
            if(user && user.is_authenticated === 3) {
                let loan_application = await models.loan_application.findAll({
                    where: {
                        user_id: req.user.id,
                        deleted: 0
                    }
                });
                let a = true;
                loan_application.map(async (ele) => {
                    if(ele.status == 0 || ele.status == 1 || ele.status == 2 || ele.status == 4) {
                        a = false;
                    };
                    return ele;
                });
                if(a == true) {
                    const result = await loan_inforamtionService.create(data);
                    const loan_infor_detail = await loan_inforamtionService.getById(result.id);
                    const total_profit = result.loan_amount * loan_infor_detail.interest_rate * result.time_loan;
                    const payment_per_period = (result.loan_amount + total_profit) / result.time_loan;
                    await models.loan_information.update({
                        total_profit: total_profit,
                        payment_per_period: payment_per_period,
                        total_payment: result.loan_amount + total_profit
                    }, {
                        where: { id: result.id, deleted: 0 }
                    });
                    const updatedLoanInfo = await models.loan_information.findOne({
                        where: { id: result.id, deleted: 0, is_check: 0 },
                        attributes: {exclude: ["created_by", "updated_date"]}
                    });
                    return res.json(responseSuccess({
                        message: 'Số tiền yêu cầu vay được tạo thành công!',
                        updatedLoanInfo
                    }));
                }else{
                    res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_EXIST,'Ban đang có một hồ sơ đang trong quá trình xét duyệt và trả. Không thể tạo đơn vay mới đến khi bạn tất toán khoản vay!'));
                }
            }else{
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_USER_IS_AUTHENTICATED,'Bạn cần xác thực thông tin của mình thì mới có thể sử dụng Vay nhanh!'));
            }
        }
        
    } catch (error) {
        logger.error('create loan_information', error);
        return res.json(responseWithError({ message: 'An error occurred' }));
    }
};

//update
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const data = {
            loan_amount: req.body.loan_amount,
            time_loan: req.body.time_loan
        };
        await models.loan_information.update(data, {
            where: {
                id: id,
                deleted: 0
            }
        });
        const loanInformation = await loan_inforamtionService.getById(id);
        const total_profit = data.loan_amount * loanInformation.interest_rate * data.time_loan;
        const payment_per_period = (data.loan_amount + total_profit) / data.time_loan;
        const updateResult = await models.loan_information.update(
            {
                total_profit: total_profit,
                payment_per_period: payment_per_period,
                total_payment: data.loan_amount + total_profit,
                updated_date: new Date()
            },
            {
                where: {
                    id: loanInformation.id,
                    deleted: 0,
                }
            }
        );
        if (updateResult[0] === 1) {
            res.json(responseSuccess({ message: 'Cập nhật thành công!' }));
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_UPDATE_FALSE,'Cập nhật thất bại!'));
        }
    } catch (error) {
        logger.error('update loan_information', error);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_UPDATE_FALSE,'Cập nhật thất bại!'));
    }
};

//getInterestRate
exports.getInterestRate = async (req, res) => {
    let data = {
        interest_rate: 0.03
    };
    res.json(responseSuccess(data));
}

