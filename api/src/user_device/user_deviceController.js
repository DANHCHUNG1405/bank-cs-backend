const userDeviceService = require("./user_deviceService");
const { ErrorCodes } = require('../../helper/constants');
const { responseSuccess, responseWithError } = require("../../helper/messageResponse");
const Paginator = require("../../commons/paginator");
const models = require('../../../models');
const logger = require('../../../winston');

// Create
exports.create = async (req, res) => {
    try {
        req.body.user_id = req.user.id;
        const data = await userDeviceService.create(req.body);
        res.json(responseSuccess({ id: data.id }))
    } catch (err) {
        logger.error('create user_device', err);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err))
    }
};

// Get All
exports.getAll = async (req, res) => {
    try {
        let condition = { 
            user_id: req.user.id
        }
        await userDeviceService.getAll(condition)
        .then((data) => {
            res.json(responseSuccess(data))
        })
        .catch((err) => {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
        });
    } catch (error) {
        logger.error('getAll user_device', error);
        res.json(responseWithError(error));
    }
};

//get all paging
exports.getAllPaging = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const { limit, offset } = Paginator.getPagination(page, size);
        const query = req.query;
        const condition = {
            limit,
            offset,
            query
        };
        await userDeviceService.getallpaging(condition).then((data) => {
            const response = Paginator.getPagingData(data, page, limit);
            res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }))
        }).catch((err) => {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
        });
    } catch (error) {
        logger.error('getAllPaging user_device', error);
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
}

//destroy
exports.destroy = async (req, res) => {
    try {
        let id = req.params.id;
        let user = await models.users.findOne({
            where: { 
                id: req.user.id,
                deleted: 0,
                status: 1
            }
        });
        if(user) {
            let data = await models.user_device.destroy({
            where: {
                id: id
            }
            });
            if (data == 1) {
                res.json(responseSuccess({message: 'Đăng xuất thành công!'}));
            } else {
                res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error'));
            }
        }else{
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_USER_DONT_EXIST, 'Người dùng không tồn tại!'));
        }
    } catch (err) {
        logger.error('destroy user_device', err);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};