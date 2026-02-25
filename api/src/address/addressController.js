const addressService = require('./addressService');
const axios = require('axios');
const { ErrorCodes } = require('../../helper/constants');
const { responseSuccess, responseWithError } = require("../../helper/messageResponse");
const Paginator = require('../../commons/paginator');
const models = require("../../../models");
const DistrictResponse = require('../../../models/GHN/districtsInfoResponse');
const ProvinceResponse = require('../../../models/GHN/provinceInfoResponse');
const WardResponse = require('../../../models/GHN/wardInfoResponse');
const logger = require('../../../winston');

//create
exports.create = async (req, res, next) => {
    try {
        let data = req.body;
        data.user_id = req.user.id;
        if(data.address_detail_1) {
            data.address_detail_1.detail = `${data.address_detail_1.unit}, ${data.address_detail_1.ward.name}, ${data.address_detail_1.district.name}, ${data.address_detail_1.city.name}`
        }
        if(data.address_detail_2) {
            data.address_detail_2.detail = `${data.address_detail_2.unit}, ${data.address_detail_2.ward.name}, ${data.address_detail_2.district.name}, ${data.address_detail_2.city.name}`
        }
        let address = await addressService.create(data);
        res.json(responseSuccess(address));
    } catch (err) {
        logger.error('create address', err);
        res.json(responseWithError(err));
    }
}

//update
exports.update = async (req, res, next) => {
    try {
        let id = req.params.id;
        let data = req.body;
        data.user_id = req.user.id;
        if (data.address_detail){
            data.address_detail.detail = `${data.unit}, ${data.address_detail.ward.name}, ${data.address_detail.district.name}, ${data.address_detail.city.name}`
        }
        let result = await addressService.update(id, data)
        if (result == 1) {
            return res.json(responseSuccess());
        }
    } catch (error) {
        logger.error('update address', error);
        res.json(responseWithError(error));
    }
}

//getAll
exports.getAll = async (req, res, next) => {
    try {
        let result = await addressService.getAll(req.query)
            return res.json(responseSuccess(result));
    } catch (error) {
        res.json(responseWithError(error));
    }
}

//getAllPaging
exports.allPaging = async (req, res, next) => {
    try {
        const user = req.user.id;
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const { limit, offset } = Paginator.getPagination(page, size);
        const query = req.query;
        const condition = {
            limit,
            offset,
            query,
            user
        };
        await addressService.getMyAddress(condition).then((data) => {
            const response = Paginator.getPagingData(data, page, limit);
            res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }))
        }).catch((err) => {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
        });
    } catch (error) {
        logger.error('getAllPaging address', error);
        res.json(responseWithError(error));
    }
}

//Delete
exports.delete = async (req, res, next) => {
    try {
        let id = req.params.id
        let data = {
            deleted: 1
        }
        let result = await addressService.update(id, data);
        if (result == 1) {
            return res.json(responseSuccess());
        }
    } catch (error) {   
        logger.error('delete address', error);
        res.json(responseWithError(error));
    }
}

//lấy ra tỉnh thành của ghn
exports.getProvince = async (req, res) => {
    try {
        const result = await axios.get('https://online-gateway.ghn.vn/shiip/public-api/master-data/province', {
            headers: {
                'token': '2095f012-c05e-11ec-8bf9-6e703843c1f8'
            }
        })
        if (result != null) {
            data = result.data.data.map((ele) => {
                return new ProvinceResponse(ele);
            })
            res.json(responseSuccess(data));
        }
        else {
            res.json(responseSuccess([]));
        }
    }
    catch (err) {
        logger.error('getProvince address', err);
        res.json(responseWithError(401, err.message, err.stack))
    }
}

//lấy quận huyện
exports.getDistrict = async (req, res) => {
    try {
        const province = parseInt(req.query.province_id);
        const body = {
            province_id : province
        }
        const result = await axios.post(
            'https://online-gateway.ghn.vn/shiip/public-api/master-data/district', JSON.stringify(body), {
            headers: {
                Accept: 'application/json',
                'Content-type': 'application/json',
                'token': '2095f012-c05e-11ec-8bf9-6e703843c1f8'
            }
        })
        if (result != null) {
            data = result.data.data.map((ele) => {
                return new DistrictResponse(ele);
            })
            res.json(responseSuccess(data));
        }
        else {
            res.json(responseSuccess([]));
        }
    }
    catch (err) {
        logger.error('getDistrict address', err);
        res.json(responseWithError(401, err.message, err.stack))
    }
}

//lấy xã phường
exports.getWard = async (req, res) => {
    try {
        const district_id =  parseInt(req.query.district_id);
        if (!district_id) {
            return res.json(responseWithError(400, 'District ID is required'));
        }
        const body = {
            district_id : district_id
        }
        const result = await axios.post(
            'https://online-gateway.ghn.vn/shiip/public-api/master-data/ward', JSON.stringify(body), {
            headers: {
                Accept: 'application/json',
                'Content-type': 'application/json',
                'token': '2095f012-c05e-11ec-8bf9-6e703843c1f8'
            }
        })
        if (result.data.data != null) {
            data = result.data.data.map((ele) => {
                return new WardResponse(ele);
            })
            res.json(responseSuccess(data));
        }
        else {
            res.json(responseSuccess([]));
        }
    }
    catch (err) {
        logger.error('getWard address', err);
        res.json(responseWithError(401, err.message, err.stack))
    }
}