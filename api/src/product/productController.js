    const productService = require('./productService');
const models = require('../../../models');
const { responseSuccess, responseWithError } = require('../../helper/messageResponse');
const logger = require('../../../winston');
const product_detailService = require('../product_detail/product_detailService');
const { image_response } = require('../../helper/image');
const Paginator = require("../../commons/paginator");
const { Op } = require('sequelize');
const { checkAccessTokenorNot } = require('../../middlewares/jwt_token');
const { ErrorCodes } = require('../../helper/constants');
models.product_detail.belongsTo(models.product, { foreignKey: 'product_id' });
models.product.hasOne(models.product_detail, { foreignKey: 'product_id' });
models.product.belongsTo(models.users, { foreignKey: 'user_id' });
models.product.belongsTo(models.category, { foreignKey: 'category_id' });
models.product_detail.belongsTo(models.location, { foreignKey: 'location_id' });

//create
exports.create = async (req, res) => {
    try {
        let data = {
            user_id: req.user.id,
            category_id: req.body.category_id,
            name: req.body.name,
            image_url: req.body.image_url,
            price_product: req.body.price_product,
            type: req.body.type,
            description: req.body.description
        };
        let result = await productService.create(data);
        let product_detail = {
            product_id: result.id,
            year_manufacture: req.body.year_manufacture,
            odo: req.body.odo,
            type_car: req.body.type_car,
            location_id: req.body.location_id
        };
        await product_detailService.create(product_detail);
        res.json(responseSuccess(result))
    } catch (error) {
        logger.error('create product', error);
        res.json(responseWithError(error));
    }
};

//getById
exports.getById = async (req, res) => {
    try {
        let id = req.params.id;
        let user = await checkAccessTokenorNot(req);
        let result = await productService.getById(id);
        if (result.image_url) {
            result.image_url = image_response(result.image_url)
        };
        if (user) {
            let product_like = await models.like.findOne({
                where: {
                    user_id: req.user.id,
                    product_id: id
                }
            });
            let product_order = await models.order.findOne({
                where: {
                    user_id: req.user.id,
                    product_id: id,
                    deleted: 0
                }
            })
            result = {
                ...result.dataValues,
                is_like : product_like ? 1 : 0,
                is_order: product_order ? 1 : 0
            }
        }
        res.json(responseSuccess(result, 'Thông tin chi tiết sản phẩm'));
    } catch (error) {
        logger.error('getById product', error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        let id = req.params.id;
        let data = await productService.getById(id);
        if (data) {
            await productService.delete(id);
            let product_detail = await product_detailService.getById(data.product_detail.id);
            await models.product_detail.update({ deleted: 1 }, { where: { id: product_detail.id, deleted: 0 } });
            res.json(responseSuccess({ message: 'Sản phầm đã bị xoá!' }));
        } else {
            return res.json(responseWithError({ message: 'Sản phẩm không tồn tại!' }));
        }
    } catch (error) {
        logger.error('delete product', error);
        res.json(responseWithError(error));
    }
};

//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        let product = await productService.getById(id);
        if (product) {
            let data = {
                category_id: req.body.category_id,
                name: req.body.name,
                image_url: req.body.image_url,
                price_product: req.body.price_product,
                description: req.body.description
            };
            await productService.update(id, data);
            let product_details = await product_detailService.getById(product.product_detail.id);
            let product_detail = {
                product_id: product.id,
                year_manufacture: req.body.year_manufacture,
                odo: req.body.odo,
                type: req.body.type,
                location: req.body.location
            };
            await product_detailService.update(product_details.id, product_detail);
            res.json(responseSuccess({ message: 'Cập nhật sản phẩm thành công!' }));
        } else {
            return res.json(responseWithError({ message: 'Sản phẩm không tồn tại!' }));
        }
    } catch (error) {
        logger.error('update product', error);
        res.json(responseWithError(error));
    }
}

//getAllPaging
exports.getAllPaging = async (req, res) => {
    try {
        const { category_id, odo, type_car, location_id, price_product, type, price, total_like } = req.query;
        let condition = {
            deleted: 0
        };
        let product = await productService.getAll(condition);
        if (!product) {
            return res.json(responseSuccess([]));
        } else {
            if (total_like === 'giam_dan') {
                product.sort((a, b) => b.total_like - a.total_like);
            } else {
                product.sort((a, b) => a.total_like - b.total_like);
            };
            if (category_id) {
                let selectedCategoryIds = category_id.split(',').map(ele => parseInt(ele.trim()));
                if (selectedCategoryIds.some(isNaN)) {
                    return res.json(responseWithError(ErrorCodes.ERROR_CODE_INVALID_PARAMETER, 'Tham số loại không hợp lệ.'));
                }
                if (selectedCategoryIds.length === 1) {
                    selectedCategoryIds = selectedCategoryIds[0];
                    product = product.filter(item => item.category.id === selectedCategoryIds);
                } else {
                    product = product.filter(item => selectedCategoryIds.includes(item.category.id));
                }
            };
            if (odo) {
                const odoRange = odo.split('-');
                if (odoRange.length === 2) {
                    const [minOdo, maxOdo] = odoRange.map(odoValue => parseFloat(odoValue));
                    if (!isNaN(minOdo) && !isNaN(maxOdo)) {
                        product = product.filter(p => p.product_detail.odo >= minOdo && p.product_detail.odo <= maxOdo);
                    }
                }
            };
            if (type_car) {
                product = product.filter(p => p.product_detail.type_car == parseInt(type_car));
            };
            if (location_id) {
                product = product.filter(p => p.product_detail.location_id === parseInt(location_id));
            };
            if (type) {
                product = product.filter(p => p.type === parseInt(type));
            };
            if (price_product === 'giam_dan') {
                product.sort((a, b) => b.price_product - a.price_product);
            }
            if (price_product === 'tang_dan') {
                product.sort((a, b) => a.price_product - b.price_product);
            }
            if (price) {
                const priceRange = price.split('-'); // Tách giá thành một mảng
                if (priceRange.length === 2) {
                    const minPrice = parseFloat(priceRange[0]);
                    const maxPrice = parseFloat(priceRange[1]);

                    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                        product = product.filter(p => p.price_product >= minPrice && p.price_product <= maxPrice);
                    }
                }
            }
            if (req.query.name && req.query.name !== '') {
                const filterData = product.filter(item => {
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
                product = filterData;
            };
            product.map(ele => {
                if (ele.image_url) {
                    ele.image_url = image_response(ele.image_url)
                }
            });

            const currentPage = parseInt(req.query.page_index) || 1;
            const perPage = parseInt(req.query.page_size);
            const totalItems = product.length;
            const startIndex = (currentPage - 1) * perPage;
            const endIndex = currentPage * perPage;
            const paginatedData = product.slice(startIndex, endIndex);
            const totalPages = Math.ceil(totalItems / perPage);
            const response = {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: currentPage,
                data: paginatedData
            };
            res.json(responseSuccess(response, 'Danh sách sản phẩm'));
        }
    } catch (error) {
        logger.error('getAllPaging product', error);
        res.json(responseWithError(error));
    }
};



