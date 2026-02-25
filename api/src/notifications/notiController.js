const notiService = require("./notiService");
const { ErrorCodes } = require('../../helper/constants');
const { responseSuccess, responseWithError } = require("../../helper/messageResponse");
const Paginator = require('../../commons/paginator');
const models = require("../../../models");
const logger = require('../../../winston');

// Get All with Paging
exports.getAllPaging = async (req, res) => {
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
        await notiService.getAllPaging(condition).then((data) => {
            const response = Paginator.getPagingData(data, page, limit);
            res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }))
        }).catch((err) => {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
        });
    } catch (error) {
        logger.error('getAllpaging noti', error);
        res.json(responseWithError(error));
    }
};

//getById
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            let result = await notiService.getById(id);
            res.json(responseSuccess(result));
        } else {
            res.json(responseWithError({ message: 'Thông báo không tồn tại!' }))
        }
    } catch (error) {
        logger.error('getById noti', error);
        res.json(responseWithError(error));
    }
}

//create
exports.create = (req, res, next) => {
    try {
        req.body.user_id = req.user.id;
        notiService.create(req.body).then(result => {
            if (result.message) {
                res.json(responseWithError(ErrorCodes.ERROR_CODE_API_NOT_FOUND));
            } else {
                res.json(responseSuccess(result));
            }
        }).catch((err) => {
            res.json(responseWithError(err.status, 'error', err.message || ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
        });
    } catch (err) {
        logger.error('create noti', err);
        return next(err);
    }
}

//update user
exports.update = async (req, res) => {
    try {
        const Id = req.params.id;
        const data = req.body;
        notiService.update(Id, data);
        res.json(responseSuccess());
    } catch (err) {
        logger.error('update noti', err);
        res.json(responseWithError(err.status, 'error', err.message || ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};

//delete
exports.delete = async (req, res, next) => {
    try {
        let id = req.params.id;
        let result = await notiService.delete(id);
        if (result == 1) {
            res.json(responseSuccess());
        } else {
            res.json(responseWithError());
        }
    } catch (error) {
        logger.error('delete noti', error);
        res.json(responseWithError(error));
    }
};

//getAllMyNotics
exports.getAllMyNotics = async (req, res) => {
    try {
        let noti = await models.notification.findAll({
            where: {
                user_id: req.user.id,
                deleted: 0
            },
            order: [["created_date", "DESC"]]
        });
        if (noti.length === 0) {
            return res.json(responseSuccess([]));
        }
        if (req.query.types) {
            let selectedTypes = req.query.types.split(',').map(type => parseInt(type.trim()));
            if (selectedTypes.some(isNaN)) {
                return res.json(responseWithError('Invalid type parameter.'));
            }
            if (selectedTypes.length === 1) {
                selectedTypes = selectedTypes[0];
                noti = noti.filter(item => item.type === selectedTypes);
            } else {
                noti = noti.filter(item => selectedTypes.includes(item.type));
            }
        }
        const totalCount = await notiService.getCountUnreadNotifications(req.user.id);
        const currentPage = parseInt(req.query.page_index) || 1;
        const perPage = parseInt(req.query.page_size);
        const totalItems = noti.length;
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = currentPage * perPage;
        const paginatedData = noti.slice(startIndex, endIndex);
        const totalPages = Math.ceil(totalItems / perPage);
        const response = {
            total_items: totalItems,
            total_pages: totalPages,
            current_page: currentPage,
            data: paginatedData,
            total_noti_unread: totalCount.length
        };
        res.json(responseSuccess(response));
    } catch (error) {
        logger.error('getAllPaing MyNoti', error);
        res.json(responseWithError(error));
    }
};

//read
exports.read = async (req, res) => {
    try {
        let id = req.params.id;
        const options_status = {
            field: "is_read",
            is_read: 1,
            updated_date: new Date()
        };
        await notiService.read(id, options_status);
        res.json(responseSuccess({ message: 'Đã đọc' }))
    } catch (error) {
        logger.error('read MyNoti', error);
        res.json(responseWithError(error));
    }
};

//readAll
exports.readAll = async (req, res) => {
    try {
        let noti = await models.notification.findAll({
            where: {
                user_id: req.user.id,
                is_read: 0,
                deleted: 0
            }
        });
        noti.map(async ele => {
            await models.notification.update({ is_read: 1, updated_date: new Date() }, { where: { id: ele.id } });
            return ele;
        });
        res.json(responseSuccess({ message: 'Đã đọc toàn bộ thông báo' }));
    } catch (error) {
        logger.error('readALLL MyNoti', error);
        res.json(responseWithError(error));
    }
}