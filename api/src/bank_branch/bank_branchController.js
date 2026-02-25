const bank_branchService = require('./bank_branchService');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const models = require('../../../models');
const { ErrorCodes } = require('../../helper/constants');
const Paginator = require("../../commons/paginator");
const { Op } = require('sequelize');

//create
exports.create = async (req, res) => {
    try {
        let bank = await models.bank_branch.findOne({
            where: {
                user_id: req.user.id,
                deleted: 0
            }
        });
        if (bank) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_EXIST, 'Ngân hàng không tồn tại!'))
        } else {
            const checkExistingAddress = await models.address.findOne({
                where: { user_id: req.user.id }
            });
            if (checkExistingAddress) {
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_ADDRESS_ALREADY_EXISTS, 'Người dùng đã có địa chỉ!'));
            } else {
                let address = {
                    address_detail_2: {
                        unit: req.body.address_detail_2.unit, 
                        ward: req.body.address_detail_2.ward,
                        district: req.body.address_detail_2.district,
                        city: req.body.address_detail_2.city
                    }
                };
                if (address.address_detail_2) {
                    address.address_detail_2.detail = `${address.address_detail_2.unit}, ${address.address_detail_2.ward.name}, ${address.address_detail_2.district.name}, ${address.address_detail_2.city.name}`
                }
                let address_bank = await models.address.create(address);
                let data = {
                    user_id: req.user.id,
                    address_id: address_bank.id,
                    name: req.body.name,
                    bank_account_name: req.body.bank_account_name,
                    account_name: req.body.account_name,
                    image_QR: req.body.image_QR,
                    lat: req.body.latitude,
                    lng: req.body.longitude
                };
                let bank_branch = await bank_branchService.create(data);
                res.json(responseSuccess(bank_branch));
            }
        }
    } catch (error) {
        logger.error('create bank_branch', error);
        res.json(responseWithError(error));
    }
};

//getAllPaging
exports.getAllPaging = async (req, res) => {
    try {
        let bank_branch = await models.bank_branch.findAll({
            where: {
                deleted: 0,
                status: 1
            }
        });
        if (bank_branch.length === 0) {
            return res.json(responseSuccess([]));
        } else {
            if (req.query.name && req.query.name !== '') {
                const filterData = bank_branch.filter(item => {
                    let strToFind = req.query.name;
                    function removeDiacritics(str) {
                        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    }
                    function isSubstring(s, strToFind) {
                        return removeDiacritics(s.toLowerCase()).includes(removeDiacritics(strToFind.toLowerCase()));
                    }
                    const nameExists = item.dataValues.hasOwnProperty('name') && typeof item.dataValues['name'] === 'string';
                    return (nameExists && isSubstring(item.name, strToFind));
                });
                bank_branch = filterData;
            }
            const currentPage = parseInt(req.query.page_index) || 1;
            const perPage = parseInt(req.query.page_size);
            const totalItems = bank_branch.length;
            const startIndex = (currentPage - 1) * perPage;
            const endIndex = currentPage * perPage;
            const paginatedData = bank_branch.slice(startIndex, endIndex);
            const totalPages = Math.ceil(totalItems / perPage);
            const response = {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: currentPage,
                data: paginatedData
            };
            res.json(responseSuccess(response));
        }
    } catch (error) {
        logger.error('getAllPAging Bank_branch', error);
        res.json(responseWithError(error));
    }
};


//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        const bank_branch = await models.bank_branch.findOne({
            where: {
                id: id,
                user_id: req.user.id,
                deleted: 0
            }
        });
        if (bank_branch) {
            let address = {
                user_id: req.user.id,
                address_detail_2: req.body.address_detail_2
            };
            await models.address.update(address, {
                where: {
                    id: bank_branch.address_id,
                    deleted: 0
                }
            });

            let data = {
                user_id: req.user.id,
                address_id: bank_branch.address_id,
                name: req.body.name,
                bank_account_name: req.body.bank_account_name,
                account_name: req.body.account_name,
                image_QR: req.body.image_QR,
                lat: req.body.latitude,
                lng: req.body.longitude
            };
            await bank_branchService.update(bank_branch.id, data);
            res.json(responseSuccess())
        } else {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Chi nhánh ngân hàng không tồn tại!'));
        }
    } catch (error) {
        logger.error('update bank_branch', error);
        res.json(responseWithError(error));
    }
};

//getBankLocationNearest
exports.getBankLocationNearest = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const distance = parseFloat(req.query.distance);
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        let count_bank = 0;
        const { limit, offset } = Paginator.getPagination(page, size);
        let data = await bank_branchService.getDistanceBankBranch(lat, lng, distance, limit, offset);
        const data_bank = await models.bank_branch.findAll({
            where: {
                deleted: 0,
                status: 1
            }
        });
        if (req.query.name && req.query.name !== '') {
            const filterData = data.filter(item => {
                let strToFind = req.query.name;
                function removeDiacritics(str) {
                    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                }
                function isSubstring(s, strToFind) {
                    return removeDiacritics(s.toLowerCase()).includes(removeDiacritics(strToFind.toLowerCase()));
                }
                const nameExists = item.hasOwnProperty('name') && typeof item['name'] === 'string';
                return (nameExists && isSubstring(item.name, strToFind));
            });
            data = filterData;
        }
        const ids = data_bank.map(item => {
            return item.id;
        });
        for (var i = 0; i < ids.length; ++i) { if (ids[i]) count_bank++; }
        const total_pages = Math.ceil(count_bank / limit);
        const response = Paginator.getPagingData(data, page, limit);
        res.json(responseSuccess({ total_items: count_bank, total_pages, current_page: response.current_page, data: data }));
    } catch (error) {
        logger.error('getBankLocationNearest', error);
        res.json(responseWithError(error));
    }
};

//getById
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        let bank_branch = await bank_branchService.getById(id);
        if (bank_branch) {
            res.json(responseSuccess(bank_branch));
        } else {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Chi nhánh ngân hàng không tồn tại!'));
        }
    } catch (error) {
        logger.error('getById bank', error);
        res.json(responseWithError(error));
    }
};

//accept
exports.accept = async (req, res) => {
    try {
        const id = req.params.id;
        await models.bank_branch.update({ status: 1, updated_date: new Date() }, { where: { id: id, status: 0, deleted: 0 } });
        res.json(responseSuccess({ message: 'Accept request accuracy infor success!' }));
    } catch (error) {
        logger.error('accept_bank', error);
        res.json(responseWithError(error));
    }
}
