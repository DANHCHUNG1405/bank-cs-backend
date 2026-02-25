const transactionService = require('./transactionService');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const models = require('../../../models');
const Paginator = require('../../commons/paginator');

//checkOut
exports.checkOut = async (req, res) => {
    try {
        await models.transaction.update({status: 1},{
            where: {
                user_id: req.user.id,
                deleted: 0,
                status: 0
            }
        })
        res.json(responseSuccess());
    } catch (error) {
        logger.error('checkOut transaction', error);
        res.json(responseWithError(error));
    }
};

//getMyTransaction
exports.getMyTransaction = async (req, res) => {
    try {
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const { limit, offset } = Paginator.getPagination(page, size);
        const condition = {
            limit,
            offset,
            user_id: req.user.id
        };
        let data = await transactionService.getMyTransaction(condition);
        const response = Paginator.getPagingData(data ,page,limit);
        res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }))
    } catch (error) {
        logger.error('getMyTransaction', error);
        res.json(responseWithError(error));
    }
}