const bannerService = require('./bannerService');
const { ErrorCodes } = require('../../helper/constants');
const { responseSuccess, responseWithError } = require("../../helper/messageResponse");
const Paginator = require('../../commons/paginator');
const models = require("../../../models");
const { image_response } = require("../../helper/image");
const logger = require('../../../winston');

//create
exports.create = async (req, res, next) => {
    try {
        let data = { 
            user_id: req.user.id,
            image_url: req.body.image_url
        }
        let result = await bannerService.create(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('create banner', error);
        res.json(responseWithError(error));
    }
}

//update
exports.update = async (req, res, next) => {
    try {
        let id = req.params.id;
        let data = { 
            user_id: req.user.id,
            image_url: req.body.image_url
        }
        let result = await bannerService.update(id, data)
        if (result == 1) {
            return res.json(responseSuccess());
        }
    } catch (error) {
        logger.error('update banner', error);
        res.json(responseWithError(error));
    }
}

//softDelete
exports.softDelete = async (req, res, next) => {
    try {
        let id = req.params.id;
        let option = {
            deleted: 1
        }
        let result = await bannerService.delete(id, option);
        if (result == 1) {
            return res.json(responseSuccess());
        }
    } catch (error) {
        logger.error('softDelete',error);
        res.json(responseWithError(error));
    }
}

//allPaging
exports.allPaging = async (req, res, next) => {
    const page = parseInt(req.query.page_index) || 1;
    const size = parseInt(req.query.page_size);
    const { limit, offset } = Paginator.getPagination(page, size);
    const query = req.query;
    const condition = {
        limit,
        offset,
        query
    };
    await bannerService.getAllPaging(condition).then((data) => {
        const response = Paginator.getPagingData(data, page, limit);
        const result = response.rows.map(item => {
            if(item.image_url !== undefined || item.image_url !== null){
                item.image_url = image_response(item.image_url);
            }
            else{
                item.image_url = undefined;
            }
            return item
        })
        res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: result }))
    }).catch((err) => {
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    });
};

//getById
exports.getById = async (req,res,next) =>{
    try {
        let banner = await bannerService.getById(req.params.id);
        if(banner.image_url !== undefined || banner.image_url !== null) {
            banner.image_url = image_response(banner.image_url)
        }
        res.json(responseSuccess(banner));
    } catch (err) {
        logger.error('getById', err)
        res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,'err',err));
    }
};

//getAll
exports.getAll = async (req, res) => {
    try {
        let data = await models.banner.findAll({
            where: { 
                deleted: 0
            }
        });
        data.map(ele => {
            if(ele.image_url) {
                ele.image_url = image_response(ele.image_url)
            };
            return ele;
        });
        res.json(responseSuccess(data));
    } catch (error) {
        logger.error('getAll banner', error);
        res.json(responseWithError(error));
    }
}