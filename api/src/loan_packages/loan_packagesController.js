const { responseSuccess, responseWithError } = require('../../helper/messageResponse.js');
const logger = require('../../../winston.js');
const { ErrorCodes } = require('../../helper/constants.js');
const Paginator = require("../../commons/paginator");

const loanPackagesService = require('./loan_packagesService.js');


function calculateMonthlyPayment(P, r, n) {
    // Bước 1: Tính (1 + r)^n
    let result1 = Math.pow((1 + r), n);

    // Bước 2: Tính result1 - 1
    let result2 = result1 - 1;

    // Bước 3: Tính r * result1
    let result3 = r * result1;

    // Bước 4: Tính số tiền phải trả hàng tháng A
    let A = P * (result3 / result2);

    return A;
}
// P Số tiền vay ban đầu
// r Lãi suất hàng tháng
// n Số tháng vay

//create
exports.create = async (req, res) => {
    try {
        req.body.investor_id = req.user.investors_id;
        //tiền trả mỗi tháng
        let monthlyPayment = calculateMonthlyPayment(req.body.loan_amount, (req.body.interest_rate / 100), req.body.time_loan);
        req.body.payment_per_period = monthlyPayment.toFixed(0);

        //tổng số tiền phải trả
        const total_payment = parseInt(monthlyPayment.toFixed(0)) * req.body.time_loan;
        req.body.total_payment = total_payment;

        //số tiền lãi
        const total_profit = total_payment - req.body.loan_amount;
        req.body.total_profit = total_profit;
        let result = await loanPackagesService.create(req.body);
        res.json(responseSuccess(result));
    } catch (error) {
        console.log(error);
        res.json(responseWithError(error));
    }
};

//getAll
exports.getAllPaging = async (req, res) => {
    try {
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const query = req.query ? req.query : null;
        const { limit, offset } = Paginator.getPagination(page, size);
        let condition = {
            limit,
            offset,
            query,
        };
        const data = await loanPackagesService.getAllPaging(condition);
        const response = Paginator.getPagingData(data, page, limit);
        res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }));
    } catch (err) {
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};

exports.getById = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await loanPackagesService.getById(id);
        res.json(responseSuccess(result));
    } catch (error) {
        res.json(responseWithError(error));
    }
};

exports.getMyLoanPackage = async (req, res) => {
    try {
        let investor_id = req.user.investors_id;
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const query = req.query ? req.query : null;
        const { limit, offset } = Paginator.getPagination(page, size);
        let condition = {
            limit,
            offset,
            query,
            investor_id
        };
        let result = await loanPackagesService.getMyLoanPackages(condition);
        const response = Paginator.getPagingData(result, page, limit);
        res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }));
    } catch (error) {
        console.log(error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await loanPackagesService.delete(id);
        res.json(responseSuccess(result));
    } catch (error) {
        res.json(responseWithError(error));
    }
};


//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        await loanPackagesService.update(id, req.body);
        res.json(responseSuccess());
    } catch (error) {
        logger.error('update category', error);
        res.json(responseWithError(error));
    }
}