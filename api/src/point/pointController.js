const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const models = require('../../../models');
const logger = require('../../../winston');
models.point.belongsTo(models.users, { foreignKey: 'user_id' });
models.authenticate_point.belongsTo(models.users, { foreignKey: 'user_id' });
models.users.hasOne(models.authenticate_point, { foreignKey: 'user_id' });
models.credit_point.belongsTo(models.users, { foreignKey: 'user_id' });
models.users.hasMany(models.credit_point, { foreignKey: 'user_id' });
models.car_buying_selling_point.belongsTo(models.users, { foreignKey: 'user_id' });
models.users.hasMany(models.car_buying_selling_point, { foreignKey: 'user_id' });
models.service_point.belongsTo(models.users, { foreignKey: 'user_id' });
models.users.hasMany(models.service_point, { foreignKey: 'user_id' });
const pointService = require('./pointService');
const Paginator = require("../../commons/paginator");

//getMyPointCredit
exports.getMyPointCredit = async (req, res) => {
    try {
        let user_id = req.user.id;
        let user = {
            id: user_id,
            credit_point: 0,
            service_point: 0,
            car_buying_selling_point: 0,
            authenticate_point: 0,
            total_point: 0
        };

        // Lấy dữ liệu từ các bảng và cập nhật vào đối tượng user
        let creditTotalPoint = await models.credit_point.sum('credit_point', { where: { user_id: user_id } });
        let serviceTotalPoint = await models.service_point.sum('service_point', { where: { user_id: user_id } });
        let carBuyingPoint = await models.car_buying_selling_point.sum('car_buying_selling_point', { where: { user_id: user_id } });
        let authenticate_point = await models.authenticate_point.findOne({ where: { user_id: user_id } });

        if (creditTotalPoint !== null && typeof creditTotalPoint !== 'undefined') {
            user.credit_point = creditTotalPoint;
        };
        if (serviceTotalPoint !== null && typeof serviceTotalPoint !== 'undefined') {
            user.service_point = serviceTotalPoint;
        };
        if (carBuyingPoint !== null && typeof carBuyingPoint !== 'undefined') {
            user.car_buying_selling_point = carBuyingPoint;
        };
        if (authenticate_point) {
            user.authenticate_point = authenticate_point.authenticate_point;
        };

        // Tính total_point
        user.total_point = user.credit_point + user.service_point + user.car_buying_selling_point + user.authenticate_point;
        let status = "";
        if (user.total_point >= 25 && user.total_point < 150) {
            status = "Fair";
        } else if (user.total_point >= 150 && user.total_point < 250) {
            status = "Good";
        } else if (user.total_point >= 250 && user.total_point < 400) {
            status = "Very Good";
        } else if (user.total_point >= 400 && user.total_point < 600) {
            status = "Exceptional";
        } else {
            status = "Poor"; // Xử lý trường hợp ngoài các khoảng đã định
        }
        // Kiểm tra xem có điểm mới nào không
        if (user.total_point !== 0) {
            const latestPoint = await models.point.findOne({
                where: { user_id: user_id },
                order: [["created_date", "DESC"]]
            });

            if (!latestPoint || user.total_point !== latestPoint.total_point) {
                await models.point.create({
                    user_id: user_id,
                    total_point: user.total_point
                });
            }
        };
        let user_info = await models.users.findOne({
            where: {
                id: user_id
            },
            attributes: { exclude: ["password", "otp", "expires", "created_by", "updated_by", "google_id", "apple_id", "facebook_id", "status", "deleted", "code_infor"] }
        });
        res.json(responseSuccess({
            ...user,
            user_info,
            status
        }));
    } catch (error) {
        logger.error('getMy point_credit', error);
        res.json(responseWithError(error))
    }
};

//getAllPaging
exports.getAllPaging = async (req, res) => {
    try {
        let condition = {
            user_id: req.user.id,
            deleted: 0
        };
        let data = await models.point.findAll({
            where: condition
        });

        // Sắp xếp dữ liệu theo thứ tự tăng dần của thời gian
        data = data.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        // Tạo mảng chứa các điểm tăng hoặc giảm và thời gian tương ứng
        let pointChangesByDate = [];
        for (let i = 1; i < data.length; i++) { // Bắt đầu từ bản ghi thứ hai
            const difference = data[i].total_point - data[i - 1].total_point;
            const pointChangeType = difference > 0 ? "Tăng điểm" : "Giảm điểm";
            const pointChangeAmount = difference > 0 ? `+${difference}` : `${difference}`;
            const currentDate = new Date(data[i].created_date);
            // Định dạng lại ngày tháng
            const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");

            const pointChangeEntry = {
                date: formattedDate,
                point_change: pointChangeAmount,
                pointChangeType: pointChangeType
            };
            
            pointChangesByDate.push(pointChangeEntry);
        }
        res.json(responseSuccess(pointChangesByDate, 'Lịch sử điểm tín dụng!'));
    } catch (error) {
        logger.error('getAllpaging Point', error);
        res.json(responseWithError(error));
    }
};













