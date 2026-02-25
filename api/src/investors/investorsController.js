const models = require('../../../models/index.js');
const { responseSuccess, responseWithError } = require('../../helper/messageResponse.js');
const logger = require('../../../winston.js');
const { ErrorCodes } = require('../../helper/constants.js');
const Paginator = require("../../commons/paginator");

const investorsService = require('./investorsService.js');
const usersService = require('../user/userService.js');

//create
exports.create = async (req, res) => {
    try {
        req.body.user_id = req.user.id;
        let result = await investorsService.create(req.body);
        if (result.status == 407) {
            res.json(responseWithError(result.status, result.message));
        } else {
            // const data_user = {
            //     role: 4
            // }
            // await usersService.update(req.user.id, data_user);
            res.json(responseSuccess(result));
        }
    } catch (error) {
        console.log(error);
        res.json(responseWithError(error));
    }
};


//acceptMember
exports.acceptInvestors = async (req, res) => {
    try {
        const id = req.params.id;
        const investors = await investorsService.getById(id);
        if (req.user.id == 2) {
            await investorsService.updateByCondition({ status: 1, updated_date: Date() }, { id: id, deleted: 0 });
            const data_user = {
                role: 4
            }
            await usersService.update(investors.user.id, data_user);
            res.json(responseSuccess());
        } else {
            res.json('Not Allowed!!!');
        }
    } catch (error) {
        logger.error(error);
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', error));
    }
}

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
        const data = await investorsService.getAllPaging(condition);
        const response = Paginator.getPagingData(data, page, limit);
        res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }));
    } catch (err) {
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};

exports.getById = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await investorsService.getById(id);
        res.json(responseSuccess(result));
    } catch (error) {
        res.json(responseWithError(error));
    }
};

exports.getMyInvestors = async (req, res) => {
    try {
        let user_id = req.user.id;
        let result = await investorsService.getMyInvestors(user_id);
        res.json(responseSuccess(result));
    } catch (error) {
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        let id = req.params.id;
        let result = await investorsService.delete(id);
        res.json(responseSuccess(result));
    } catch (error) {
        res.json(responseWithError(error));
    }
};


//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        await investorsService.update(id, req.body);
        res.json(responseSuccess())
    } catch (error) {
        logger.error('update category', error);
        res.json(responseWithError(error));
    }
}