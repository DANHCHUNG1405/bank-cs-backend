const orderService = require('./orderService');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const { generateCode } = require('../../helper/generateCode');
const models = require('../../../models');
const { Op } = require('sequelize');
const notiService = require('../notifications/notiService');
const productService = require('../product/productService');
const { notiFcm } = require('../../helper/fcm');
const { ErrorCodes } = require('../../helper/constants');
const Paginator = require('../../commons/paginator');
const { host } = require('../../../config/config.json');
const { image_response } = require('../../helper/image');
models.order.belongsTo(models.loan_application, { foreignKey: 'loan_application_id' });


//create
exports.create = async (req, res) => {
    try {
        const data = {
            user_id: req.user.id,
            loan_application_id: req.body.loan_application_id,
            product_id: req.body.product_id,
            bought_from: req.body.bought_from,
            type: req.body.type
        };
        // Kiểm tra xem sản phẩm có sẵn để mua hoặc thuê hay không
        const existingProduct = await models.product.findOne({
            where: {
                id: data.product_id,
                is_available: true
            }
        });

        if (!existingProduct) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Sản phẩm này không có sẵn để thuê hoặc mua.'));
        }

        // Kiểm tra xem người dùng đã có đơn hàng loại 1 hoặc loại 2 chưa
        const existingOrderForProduct = await models.order.findOne({
            where: {
                user_id: data.user_id,
                [Op.or]: [
                    { type: 1 },
                    { type: 2 }
                ],
                deleted: 0
            }
        });
        // Kiểm tra loại đơn hàng (type) của người dùng và thực hiện kiểm tra tương ứng
        if (data.type === 1) {
            if (existingOrderForProduct && existingOrderForProduct.type === 1 && existingOrderForProduct.status !== 3 && existingOrderForProduct.status !== 2) {
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_EXIST, 'Bạn không thể tạo đơn hàng loại 1 mới cho đến khi bạn thanh toán hết đơn hàng hiện có.'));
            }
        } else if (data.type === 2) {
            if (existingOrderForProduct && existingOrderForProduct.type === 2 && existingOrderForProduct.status !== 3 && existingOrderForProduct.status !== 2) {
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_EXIST, 'Bạn không thể tạo đơn hàng loại 2 mới cho đến khi bạn thanh toán hết đơn hàng hiện có.'));
            }
        }

        // Tiến hành tạo đơn đặt hàng
        const order = await orderService.create(data);
        const code = generateCode(15, order);
        await models.order.update({ code: code }, { where: { id: order.id } });

        // Cập nhật trạng thái của sản phẩm thành "false" sau khi đơn hàng đã được tạo
        await models.product.update({ is_available: false }, { where: { id: data.product_id } });
        res.json(responseSuccess({ message: 'Đơn hàng của bạn đã được đặt. Vui lòng đợi liên hệ của người bán!' }));
    } catch (error) {
        logger.error('create order', error);
        res.json(responseWithError(error));
    }
};

//acceptOrder
exports.acceptOrder = async (req, res) => {
    try {
        let data = {
            status: req.body.status
        };
        let order_id = req.params.order_id;
        let order = await models.order.findOne({
            where: {
                id: order_id,
                deleted: 0
            }
        });
        let product = await models.product.findOne({
            where: {
                id: order.product_id,
                deleted: 0
            }
        })
        if (req.user.id == order.bought_from) {
            if (product.type == 1) {
                //Với đơn hàng sản phẩm là mua xe 
                if (order.type == 2) {
                    //Đơn hàng mua bằng hình thức trả thẳng
                    await orderService.update(order_id, data);
                    const optionStatus = (item) => {
                        switch (item) {
                            case 1:
                                return "Đơn hàng có mã " + order.code + " của bạn đang được xử lý";
                            case 2:
                                return "Đơn hàng có mã " + order.code + " của bạn đã bị huỷ";
                            case 3:
                                return "Đơn hàng có mã " + order.code + " của bạn đã hoàn tất";
                            default:
                                break;
                        }
                    }
                    const payload = {
                        notifications: {
                            title: `Cập nhật đơn hàng!!!`,
                            body: `${optionStatus(data.status)}`,
                            name: `Thông báo đơn hàng`,
                            content: `${optionStatus(data.status)}`,
                            type_id: order.id.toString(),
                            type: "4",
                            deep_link: `${host.host_deeplink}${host.api_deeplink.order}${order.id}`,
                            user_id: order.user_id.toString()
                        }
                    };
                    const noti = await notiService.create(payload.notifications);
                    notiFcm(order.user_id, payload.notifications, noti.id);
                    if (data.status == 2) {
                        await models.order.update({ deleted: 1, is_order: 0 }, { where: { id: order.id } });
                    };
                    if (data.status == 3) {
                        const hasPointsBeenAdded = await models.car_buying_selling_point.findOne({
                            where: {
                                order_id: order.id
                            }
                        });
                        if (!hasPointsBeenAdded) {
                            let car_point = 35; // Điểm mặc định khi người dùng hoàn thành đơn mua/thuê xe
                            let pointData = {
                                user_id: order.user_id,
                                car_buying_selling_point: car_point,
                                order_id: order.id
                            }
                            await models.car_buying_selling_point.create(pointData);
                            let product = await productService.getById(order.product_id);
                            await models.product.update({ deleted: 1, updated_date: new Date() }, { where: { id: product.id } })
                        }
                    }
                    res.json(responseSuccess());
                } else if (order.type == 1) {
                    //Với đơn hàng mua bằng hình thức trả góp
                    await orderService.update(order_id, data);
                    const optionStatus = (item) => {
                        switch (item) {
                            case 1:
                                return "Đơn hàng có mã " + order.code + " của bạn đang được xử lý";
                            case 2:
                                return "Đơn hàng có mã " + order.code + " của bạn đã bị huỷ";
                            case 3:
                                return "Đơn hàng có mã " + order.code + " của bạn đã hoàn tất";
                            default:
                                break;
                        }
                    }
                    const payload = {
                        notifications: {
                            title: `Cập nhật đơn hàng!!!`,
                            body: `${optionStatus(data.status)}`,
                            name: `Thông báo đơn hàng`,
                            content: `${optionStatus(data.status)}`,
                            type_id: order.id.toString(),
                            type: "4",
                            deep_link: `${host.host_deeplink}${host.api_deeplink.order}${order.id}`,
                            user_id: order.user_id.toString()
                        }
                    };
                    const noti = await notiService.create(payload.notifications);
                    notiFcm(order.user_id, payload.notifications, noti.id);
                    if (data.status == 2) {
                        await models.order.update({ deleted: 1, is_order: 0 }, { where: { id: order.id } });
                        let loan_application = await models.loan_application.findOne({
                            where: {
                                id: order.loan_application_id,
                                deleted: 0,
                                [Op.or]: [
                                    { status: 0 },
                                    { status: 1 },
                                    { status: 2 }
                                ]
                            }
                        });
                        if (loan_application) {
                            await models.loan_application.update({ deleted: 1, status: 3 }, { where: { id: loan_application.id } });
                            let borrower_information = await models.borrower_information.findOne({
                                where: {
                                    id: loan_application.borrower_information_id,
                                    deleted: 0,
                                    status: 0
                                }
                            });
                            if (borrower_information) {
                                await models.borrower_information.update({ deleted: 1 }, { where: { id: borrower_information.id } });
                                let loan_information = await models.loan_information.findOne({
                                    where: {
                                        id: loan_application.loan_information_id,
                                        deleted: 0,
                                        is_check: 0
                                    }
                                });
                                if (loan_information) {
                                    await models.loan_information.update({ deleted: 1 }, { where: { id: loan_information.id } })
                                }
                            }
                        }
                    };
                    if (data.status == 3) {
                        const hasPointsBeenAdded = await models.car_buying_selling_point.findOne({
                            where: {
                                order_id: order.id
                            }
                        });
                        if (!hasPointsBeenAdded) {
                            let car_point = 35; // Điểm mặc định khi người dùng hoàn thành đơn mua/thuê xe
                            let pointData = {
                                user_id: order.user_id,
                                car_buying_selling_point: car_point,
                                order_id: order.id
                            }
                            await models.car_buying_selling_point.create(pointData);
                            let product = await productService.getById(order.product_id);
                            await models.product.update({ deleted: 1, updated_date: new Date() }, { where: { id: product.id } })
                        }
                    }
                    res.json(responseSuccess());
                }
            } else if (product.type == 2) {
                //Với đơn hàng sản phẩm là thuê xe 
                await orderService.update(order_id, data);
                const optionStatus = (item) => {
                    switch (item) {
                        case 1:
                            return "Đơn hàng có mã " + order.code + " của bạn đang được xử lý";
                        case 2:
                            return "Đơn hàng có mã " + order.code + " của bạn đã bị huỷ";
                        case 3:
                            return "Đơn hàng có mã " + order.code + " của bạn đã hoàn tất";
                        default:
                            break;
                    }
                }
                const payload = {
                    notifications: {
                        title: `Cập nhật đơn hàng!!!`,
                        body: `${optionStatus(data.status)}`,
                        name: `Thông báo đơn hàng`,
                        content: `${optionStatus(data.status)}`,
                        type_id: order.id.toString(),
                        type: "4",
                        deep_link: `${host.host_deeplink}${host.api_deeplink.order}${order.id}`,
                        user_id: order.user_id.toString()
                    }
                };
                const noti = await notiService.create(payload.notifications);
                notiFcm(order.user_id, payload.notifications, noti.id);
                if (data.status == 2) {
                    await models.order.update({ deleted: 1, is_order: 0 }, { where: { id: order.id } });
                };
                if (data.status == 3) {
                    // Kiểm tra xem đã cộng điểm cho đơn hàng này hay chưa
                    const hasPointsBeenAdded = await models.car_buying_selling_point.findOne({
                        where: {
                            order_id: order.id
                        }
                    });
                    if (!hasPointsBeenAdded) {
                        let car_point = 35; // Điểm mặc định khi người dùng hoàn thành đơn mua/thuê xe
                        let pointData = {
                            user_id: order.user_id,
                            car_buying_selling_point: car_point,
                            order_id: order.id
                        }
                        await models.car_buying_selling_point.create(pointData);
                        // Cập nhật trạng thái sản phẩm
                        let product = await productService.getById(order.product_id);
                        await models.product.update({ is_available: 1, deleted: 1, updated_date: new Date() }, { where: { id: product.id } })
                    }
                }
                res.json(responseSuccess());
            }
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_NOT_ALLOWED))
        }
    } catch (error) {
        logger.error('acceptOrder', error);
        res.json(responseWithError(error));
    }
};

// getMyOrder
exports.getMyOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const { limit, offset } = Paginator.getPagination(page, size);
        const query = req.query;
        let condition = {
            query,
            limit,
            offset,
            user_id: req.user.id
        };
        let data = await orderService.getAllPaging(condition);
        if (!data) {
            res.json(responseSuccess([]));
        } else {
            const response = Paginator.getPagingData(data, page, limit);
            res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: response.rows }));
        }
    } catch (error) {
        logger.error('getMyOrder', error);
        res.json(responseWithError(error));
    }
};

//getById
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        let order = await models.order.findOne({
            where: {
                id: id
            },
            attributes: { exclude: ["created_by", "updated_by"] },
            include: [{
                model: models.product,
                attributes: ["id", "name", "price_product", "image_url", "created_date"]
            }, {
                model: models.users,
                attributes: ["id", "full_name", "address_id"],
                include: [{
                    model: models.address,
                    attributes: { exclude: ["created_by", "updated_by"] }
                }]
            }, {
                model: models.loan_application,
                attributes: ["id", "status"],
                include: [{
                    model: models.loan_information,
                    attributes: ["id", "time_loan", "payment_per_period"]
                }]
            }],
        });
        if (order) {
            let seller = await models.users.findOne({
                where: {
                    id: order.bought_from,
                    status: 1,
                    deleted: 0
                },
                attributes: ["id", "full_name", "address_id"],
                include: [{
                    model: models.address,
                    attributes: { exclude: ["created_by", "updated_by"] }
                }]
            });
            if(order.product.image_url) {
                order.product.image_url = image_response(order.product.image_url)
            }
            res.json(responseSuccess({ ...order.dataValues, seller }));
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Đơn hàng không tồn tại!'));
        }
    } catch (error) {
        logger.error('Order Detail', error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        let id = req.params.id;
        let order = await orderService.getById(id);
        if (order.status == 0 || order.status == 1) {
            await models.order.update({ deleted: 1, status: 2, is_order: 0 }, { where: { id: order.id } });
            let product = await models.product.findOne({
                where: {
                    id: order.product_id
                }
            })
            await models.product.update({ is_available: true, update_date: new Date() }, { where: { id: product.id } })
            const payload = {
                notifications: {
                    title: `Thông báo huỷ đơn hàng`,
                    body: `Đơn hàng có mã ${order.code} của bạn đã bị huỷ`,
                    name: `Thông báo huỷ đơn hàng`,
                    content: `Đơn hàng có mã ${order.code} của bạn đã bị huỷ`,
                    type_id: order.id.toString(),
                    type: "4",
                    deep_link: `${host.host_deeplink}${host.api_deeplink.order}${order.id}`,
                    user_id: order.user_id.toString()
                }
            };
            const noti = await notiService.create(payload.notifications);
            notiFcm(order.user_id, payload.notifications, noti.id);
            let loan_application = await models.loan_application.findOne({
                where: {
                    id: order.loan_application_id,
                    deleted: 0,
                    [Op.or]: [
                        { status: 0 },
                        { status: 1 },
                        { status: 2 }
                    ]
                }
            });
            if (loan_application) {
                await models.loan_application.update({ deleted: 1, status: 3 }, { where: { id: loan_application.id } });
                let borrower_information = await models.borrower_information.findOne({
                    where: {
                        id: loan_application.borrower_information_id,
                        deleted: 0,
                        status: 0
                    }
                });
                if (borrower_information) {
                    await models.borrower_information.update({ deleted: 1 }, { where: { id: borrower_information.id } });
                    let loan_information = await models.loan_information.findOne({
                        where: {
                            id: loan_application.loan_information_id,
                            deleted: 0,
                            is_check: 0
                        }
                    });
                    if (loan_information) {
                        await models.loan_information.update({ deleted: 1 }, { where: { id: loan_information.id } })
                    }
                }
            }
            res.json(responseSuccess({ message: "Huỷ đơn hàng thành công!" }))
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Đơn hàng không tồn tại!'));
        }
    } catch (error) {
        logger.error('delete order', error);
        res.json(responseWithError(error));
    }
};

//getAllPaging
exports.getAllPaging = async (req, res) => {
    try {
        const { status, type, price_product } = req.query;
        let order = await models.order.findAll({
            where: {
                [Op.or]: [
                    { deleted: 0 },
                    { deleted: 1 }
                ]
            },
            attributes: { exclude: ["created_by", "updated_by"] },
            order: [["created_date", "DESC"]],
            include: [{
                model: models.product,
                attributes: {exclude:["user_id", "created_by", "updated_by"]}
            }]
        });
        if (!order) {
            res.json(responseSuccess([], 'Không có yêu cầu đặt hàng nào!'));
        } else {
            if (price_product === 'giam_dan') {
                order[0].products.sort((a, b) => b.price - a.price); // Sắp xếp giảm dần
            }
            if (price_product === 'tang_dan') {
                order[0].products.sort((a, b) => a.price - b.price); // Sắp xếp tăng dần
            }
            if (type) {
                order = order.filter(o => o.type === parseInt(type))
            };
            if (status) {
                order = order.filter(o => o.status === parseInt(status))
            }
            const currentPage = parseInt(req.query.page_index) || 1;
            const perPage = parseInt(req.query.page_size);
            const totalItems = order.length;
            const startIndex = (currentPage - 1) * perPage;
            const endIndex = currentPage * perPage;
            const paginatedData = order.slice(startIndex, endIndex);
            const totalPages = Math.ceil(totalItems / perPage);
            const response = {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: currentPage,
                data: paginatedData
            };
            res.json(responseSuccess(response, 'Danh sách đơn hàng!'));
        }
    } catch (error) {
        logger.error('getAllPaging', error);
        res.json(responseWithError(error));
    }
}
