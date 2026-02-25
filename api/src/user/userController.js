const userService = require("./userService");
const { ErrorCodes } = require('../../helper/constants');
const { signAccessToken, signRefreshToken, checkRefreshToken, checkAccessTokenorNot } = require('../../middlewares/jwt_token');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-client');
const { responseSuccess, responseWithError } = require("../../helper/messageResponse");
const Paginator = require('../../commons/paginator');
const models = require("../../../models");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const mailService = require("../../middlewares/mail");
const { contentOTPMail } = require('../../constant/contentOTPMail');
const messageConstants = require("../../constant/messageConstants");
const { image_response } = require('../../helper/image');
const logger = require('../../../winston');
const axios = require('axios');
models.users.belongsTo(models.address, { foreignKey: 'address_id' });
models.address.hasOne(models.users, { foreignKey: 'address_id' });
const admin = require('firebase-admin');
const serviceAccount = require('../../../smiletech-app-2023-firebase-adminsdk-p8k8d-626e8ecd52.json');
const user_deviceService = require('../user_device/user_deviceService');
const notiService = require('../notifications/notiService');
const { notiFcm } = require('../../helper/fcm');
const { host } = require('../../../config/config.json');
models.user_device.belongsTo(models.users, { foreignKey: 'user_id' });
models.users.hasOne(models.user_device, { foreignKey: 'user_id' })
const userDeviceService = require("../user_device/user_deviceService");
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
models.point.belongsTo(models.users, { foreignKey: 'user_id' });
models.users.hasMany(models.point, { foreignKey: 'user_id' });

//callFiresBase-Admin
const sendMessage = async (user_id, data, id) => {
    const data_device = await userDeviceService.getDeviceByUser(user_id);
    if (data_device === null) {
        return [];
    } else {
        const message = {
            token: data_device.token_device,  // Token của thiết bị nhận thông báo
            notification: {
                title: data.title,
                body: data.body,
            },
            data: {
                id: id.toString(),
                data: data.toString()
            }
        };


        try {
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
};

// // Gọi hàm với token thiết bị của bạn
// const deviceToken = 'your_device_token_here'; // Thay bằng token của thiết bị nhận thông báo
// sendMessage(deviceToken);

// async function notiT(user_id, data, id) {
//     try {
//         const data_device = await userDeviceService.getDeviceByUser(user_id);
//         if (data_device === null) {
//             return [];
//         } else {
//             const firebaseToken = data_device.token_device;
//             const payload = {
//                 notification: {
//                     title: data.title,
//                     body: data.body,
//                     otp: data.otp
//                 },
//                 data: {
//                     id: id.toString(),
//                     ...data
//                 }
//             };
//             const response = await admin.messaging().sendToDevice(firebaseToken, payload);
//             return response;
//         }
//     } catch (error) {
//         throw error;
//     }
// }

// Get All with Paging
exports.getAllPaging = async (req, res) => {
    try {
        const { gender, total_point, role, is_authenticated } = req.query;
        let data = await models.users.findAll({
            where: {
                deleted: 0,
                [Op.or]: [
                    { role: 1 },
                    { role: 3 }
                ]
            },
            attributes: { exclude: ["otp", "password", "token", "created_by", "updated_by", "google_id", 'self_generated_code', "facebook_id", "expires", "apple_id", "referral_code", "referral_code_usage_count"] },
            order: [["created_date", "DESC"]],
            include: [{
                model: models.point,
                order: [["created_date", "DESC"]],
                limit: 1,
                attributes: ["total_point"]
            }]
        });

        if (!data) {
            res.json(responseSuccess([]))
        } else {
            if (gender) {
                data = data.filter(d => d.gender === parseInt(gender))
            };
            if (is_authenticated) {
                data = data.filter(d => d.is_authenticated === parseInt(is_authenticated))
            };
            if (total_point === 'giam_dan') {
                data.sort((a, b) => ((b.point && b.point.length > 0) ? b.point[0].total_point : 0) - ((a.point && a.point.length > 0) ? a.point[0].total_point : 0));
            } else if (total_point === 'tang_dan') {
                data.sort((a, b) => ((a.point && a.point.length > 0) ? a.point[0].total_point : 0) - ((b.point && b.point.length > 0) ? b.point[0].total_point : 0));
            }
            if (role) {
                data = data.filter(d => d.role === parseInt(role))
            };
            if (req.query.full_name && req.query.full_name !== '') {
                const filterData = data.filter(item => {
                    let strToFind = req.query.full_name;
                    function removeDiacritics(str) {
                        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    }
                    function isSubstring(s, strToFind) {
                        return removeDiacritics(s.toLowerCase()).includes(removeDiacritics(strToFind.toLowerCase()));
                    }
                    const FullnameExists = item.dataValues.hasOwnProperty('full_name') && typeof item.dataValues['full_name'] === 'string';
                    return (FullnameExists && isSubstring(item.full_name, strToFind));
                });
                data = filterData;
            };
            const transformedData = data.map(user => {
                let p = 0;
                if (user.points) {
                    p = user.points.map(item => item.total_point).reduce((a, b) => a + b, 0);
                }
                return {
                    id: user.id,
                    address_id: user.address_id,
                    full_name: user.full_name,
                    gender: user.gender,
                    dob: user.dob,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    cover_image: user.cover_image,
                    type_certificate_identify: user.type_certificate_identify,
                    certificate_identify: user.certificate_identify,
                    date_range: user.date_range,
                    front_photo: user.front_photo,
                    back_side_photo: user.back_side_photo,
                    issued_by: user.issued_by,
                    role: user.role,
                    is_online: user.is_online,
                    is_authenticated: user.is_authenticated,
                    status: user.status,
                    deleted: user.deleted,
                    created_date: user.created_date,
                    updated_date: user.updated_date,
                    total_point: p
                };
            });
            const currentPage = parseInt(req.query.page_index) || 1;
            const perPage = parseInt(req.query.page_size);
            const totalItems = transformedData.length;
            const startIndex = (currentPage - 1) * perPage;
            const endIndex = currentPage * perPage;
            const paginatedData = transformedData.slice(startIndex, endIndex);
            const totalPages = Math.ceil(totalItems / perPage);
            const response = {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: currentPage,
                data: paginatedData
            };
            res.json(responseSuccess(response, "Danh sách người dùng"));
        }
    } catch (error) {
        logger.error('getAllPAging user', error);
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', error));
    }
};

//getById;
exports.getById = async (req, res) => {
    try {
        let id = req.params.id;
        const user = await userService.getById(id);
        if (!user) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_USER_DONT_EXIST, "Người dùng không tồn tại!"));
        }
        delete user.dataValues.address;
        delete user.dataValues.address_id;
        let userResponse = {
            ...user.dataValues
        };
        if (user.address) {
            userResponse.address_detail_1 = user.address.address_detail_1;
            userResponse.address_detail_2 = user.address.address_detail_2;
        } else {
            userResponse.address_detail_1 = null;
            userResponse.address_detail_2 = null;
        }
        return res.json(responseSuccess(userResponse));
    } catch (error) {
        logger.error('getById user', error);
        res.json(responseWithError(error))
    }
};

//getMyProfile
exports.getMyProfile = async (req, res) => {
    try {
        const user = await models.users.findOne({
            where: {
                id: req.user.id,
                status: 1,
                deleted: 0
            },
            attributes: { exclude: ["otp", "password", "expires", "created_by", "updated_by"] },
            include: [
                {
                    model: models.address,
                    attributes: { exclude: ["id", "user_id", "created_by", "updated_by", "status", "deleted"] }
                }
            ]
        });
        if (!user) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_USER_DONT_EXIST, "Người dùng không tồn tại!"));
        }
        delete user.dataValues.address;
        let userResponse = {
            ...user.dataValues
        };
        if (user.address) {
            userResponse.address_detail_1 = user.address.address_detail_1;
            userResponse.address_detail_2 = user.address.address_detail_2;
        } else {
            userResponse.address_detail_1 = null;
            userResponse.address_detail_2 = null;
        }
        return res.json(responseSuccess(userResponse));
    } catch (error) {
        logger.error('getMyProfile', error);
        res.json(responseWithError(error));
    }
}

//register
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://console.firebase.google.com/u/3/project/smt-technology-group/settings/cloudmessaging' // Thay thế bằng URL của dự án Firebase của bạn
    });
};
// exports.register = async (req, res, next) => {
//     console.log(req.body);
//     try {
//         let data = {
//             phone: req.body.phone,
//             email: req.body.email,
//             full_name: req.body.full_name,
//             password: req.body.password
//         }
//         const existingUser = await models.users.findOne({
//             where: {
//                 [Op.or]: [
//                     { email: req.body.email },
//                     { phone: req.body.phone }
//                 ],
//                 status: 1,
//                 deleted: 0
//             }
//         });
//         if (existingUser) {
//             res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_OR_PHONE_EXIST, 'Email hoặc Phone đã tồn tại'));
//         } else {
//             let result = await userService.register(data);
//             if (result.email) {
//                 const user = await models.users.findOne({
//                     where: {
//                         id: result.id,
//                         status: 0,
//                         deleted: 0
//                     }
//                 });
//                 // Tạo mã ngẫu nhiên 6 chữ số làm self_generated_code
//                 const self_generated_code = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
//                 await models.users.update({ self_generated_code: self_generated_code }, { where: { id: result.id } });
//                 const user_device = {
//                     user_id: user.id,
//                     unique_id: req.body.unique_id,
//                     token_device: req.body.token_device,
//                     device_name: req.body.device_name
//                 };
//                 let device = await userDeviceService.create(user_device);
//                 let otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
//                 let options = contentOTPMail(otp);
//                 const data = await userService.update(result.id, options);
//                 if (data == true) {
//                     res.json(responseSuccess({
//                         id: result.id,
//                         phone: result.phone,
//                         email: result.email,
//                         full_name: result.full_name,
//                         role: result.role,
//                     }));
//                     const host = req.headers.host
//                     mailService.sendMailVerifyByOTP(host, req.body.email, otp, result.email);
//                     const registrationToken = await user_deviceService.getbyID(device.id);
//                     if (registrationToken) {
//                         const message = `Your OTP code is: ${otp}`;
//                         const phoneNumber = req.body.phone;
//                         const smsOptions = {
//                             token: registrationToken.unique_id,
//                             notification: {
//                                 title: 'OTP Code',
//                                 body: message,
//                             },
//                             data: {
//                                 otp: otp.toString(),
//                                 phoneNumber: phoneNumber
//                             }
//                         };
//                         // Gửi SMS
//                         try {
//                             const response = await admin.messaging().send(smsOptions);
//                         } catch (error) {
//                             console.error('Error sending OTP SMS:', error);
//                         }
//                     } else {
//                         console.log("Registration token not found for user:", user.id);
//                     }
//                 } else {
//                     res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'Lỗi rồi nè!'));
//                 }
//             } else {
//                 await userService.update(result.id, options);
//                 res.json(responseSuccess({
//                     id: result.id,
//                     phone: result.phone,
//                     email: result.email,
//                     full_name: full_name_user,
//                     role: result.role,
//                 }));
//             }
//         }
//     } catch (error) {
//         logger.error('register user', error);
//         return next(error);
//     }
// };
exports.register = async (req, res, next) => {
    try {
        let data = {
            phone: req.body.phone || null,
            email: req.body.email,
            full_name: req.body.full_name,
            password: req.body.password
        };
        if(req.body.phone) {
            const existingUser = await models.users.findOne({
                where: {
                    [Op.or]: [
                        { phone: req.body.phone },
                        { email: req.body.email }
                    ],
                    status: 1,  
                    deleted: 0
                }
            });
            if (existingUser) {
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_OR_PHONE_EXIST, 'Email hoặc Phone đã tồn tại'));
            }
        } else {
            const existingUser = await models.users.findOne({
                where: {
                    email: req.body.email,
                    status: 1,
                    deleted: 0
                }
            });
            if (existingUser) {
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_OR_PHONE_EXIST, 'Email đã tồn tại'));
            }
        }
        const result = await userService.register(data);

        if (!result || !result.email) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'Đăng ký thất bại!'));
        }

        const user = await models.users.findOne({
            where: {
                id: result.id,
                status: 0,
                deleted: 0
            }
        });

        if (!user) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'Không tìm thấy tài khoản mới tạo.'));
        }

        const self_generated_code = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
        await models.users.update({ self_generated_code: self_generated_code }, { where: { id: result.id } });

    
        const user_device = {
            user_id: user.id,
            unique_id: req.body.unique_id,
            token_device: req.body.token_device,
            device_name: req.body.device_name
        };
        const device = await userDeviceService.create(user_device);
        const otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
        const options = contentOTPMail(otp);
        const isUpdated = await userService.update(result.id, options);

        if (!isUpdated) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'Cập nhật thông tin thất bại!'));
        }
        const host = req.headers.host;
        mailService.sendMailVerifyByOTP(host, req.body.email, otp, result.email);
        if (device) {
            const registrationToken = await userDeviceService.getbyID(device.id);

            if (registrationToken) {
                const message = `Your OTP code is: ${otp}`;
                const smsOptions = {
                    token: registrationToken.unique_id,
                    notification: {
                        title: 'OTP Code',
                        body: message,
                    },
                    data: {
                        otp: otp.toString(),
                        ...(req.body.phone && { phoneNumber: req.body.phone })
                    }
                };

                try {
                    const response = await admin.messaging().send(smsOptions);
                    console.log("SMS sent successfully:", response);
                } catch (error) {
                    console.error('Error sending OTP SMS:', error);
                }
            } else {
                console.error("Registration token not found for user:", user.id);
            }
        }
        return res.json(responseSuccess({
            id: result.id,
            phone: result.phone,
            email: result.email,
            full_name: result.full_name,
            role: result.role,
        }));

    } catch (error) {
        logger.error('register user', error);
        return next(error);
    }
};


exports.registerWeb = async (req, res, next) => {
    try {
        let data = {
            phone: req.body.phone,
            email: req.body.email,
            full_name: req.body.full_name,
            password: req.body.password,
            status: 1
        }
        const existingUser = await models.users.findOne({
            where: {
                [Op.or]: [
                    { email: req.body.email },
                    { phone: req.body.phone }
                ],
                status: 1,
                deleted: 0
            }
        });
        if (existingUser) {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_OR_PHONE_EXIST, 'Email hoặc Phone đã tồn tại'));
        } else {
            let result = await userService.register(data);
            res.json(responseSuccess({
                id: result.id,
                phone: result.phone,
                email: result.email,
                full_name: result.full_name,
                role: result.role,
            }));
        }
    } catch (error) {
        logger.error('register user', error);
        return next(error);
    }
}

// Login
exports.login = async (req, res, next) => {
    try {
        const data = {
            user_name: req.body.user_name,
            password: req.body.password,
            unique_id: req.body.unique_id,
            token_device: req.body.token_device,
            device_name: req.body.device_name
        };
        const isSpecialCase = !data.unique_id || !data.token_device || !data.device_name;
        const result = await userService.login(data);
        if (result.message) {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_INVALID_USERNAME_OR_PASSWORD, 'User_name hoặc Password không đúng'));
        } else {
            const user = await models.users.findOne({
                where: {
                    id: result.user.id,
                    status: 1,
                    deleted: 0
                },
                attributes: {
                    exclude: ["otp", "password", "expires", "created_by", "updated_by"]
                },
                include: [
                    {
                        model: models.address,
                        attributes: {
                            exclude: ["id", "user_id", "created_by", "updated_by", "status", "deleted"]
                        }
                    },
                    {
                        model: models.user_device,
                        attributes: { exclude: ["created_by", "updated_by"] }
                    }
                ]
            });
            const existingLogin = await models.user_device.findOne({
                where: {
                    user_id: result.user.id
                }
            });

            // Khai báo user_device_id và uniqueId bên ngoài điều kiện
            let user_device_id = null;
            let uniqueId = null;

            const updateLoginTime = async () => {
                await models.user_device.update(
                    { token_device: req.body.token_device, created_date: new Date() },
                    {
                        where: {
                            user_id: result.user.id
                        }
                    }
                );
            };

            const createOrUpdateUserDevice = async () => {
                const userDeviceData = {
                    user_id: result.user.id,
                    unique_id: req.body.unique_id,
                    token_device: req.body.token_device,
                    device_name: req.body.device_name,
                    created_date: new Date()
                };
                await models.user_device.upsert(userDeviceData);
            };

            if (isSpecialCase) {
                delete user.dataValues.user_device;
                const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                const response = {
                    data_user: {
                        ...user.dataValues,
                        address_detail_1: addressDetail1,
                        address_detail_2: addressDetail2,
                    },
                    access_token: result.accessToken,
                    refresh_token: result.refreshToken
                };
                res.json(responseSuccess(response, "Đăng nhập thành công!"));
            } else {
                if (existingLogin && existingLogin.unique_id != data.unique_id) {
                    const otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
                    const options = contentOTPMail(otp);
                    await models.users.update(options, { where: { id: result.user.id } });
                    await createOrUpdateUserDevice();

                    // Truy vấn dữ liệu từ bảng user_device
                    const user_device = await models.user_device.findAll({
                        where: {
                            user_id: user.id
                        },
                        order: [["created_date", "ASC"]]
                    });

                    if (user_device.length > 0) {
                        const firstUserDevice = user_device[0];
                        user_device_id = firstUserDevice.id;
                        uniqueId = firstUserDevice.unique_id;
                    }
                    const firstUserDevice = user_device[0];
                    const firstUserId = firstUserDevice.user_id;
                    const payload = {
                        notifications: {
                            title: `Yêu cầu đăng nhập`,
                            body: `Đã có yêu cầu đăng nhập bằng email ${user.email}`,
                            otp: `${otp}`,
                            name: `Đã có yêu cầu đăng nhập bằng email ${user.email}`,
                            content: `Đã có yêu cầu đăng nhập bằng email ${user.email} trên thiết bị có tên là: ${req.body.device_name}`,
                            type_id: firstUserId.toString(),
                            type: "7",
                            user_id: firstUserId.toString()
                        }
                    };
                    const noti = await notiService.create(payload.notifications);
                    // sendMessage(firstUserId, payload.notifications, noti.id);

                } else if (existingLogin && existingLogin.unique_id == data.unique_id) {
                    await updateLoginTime();
                    const user_device = await models.user_device.findAll({
                        where: {
                            user_id: user.id
                        },
                        order: [["created_date", "ASC"]]
                    });
                    if (user_device.length > 0) {
                        const firstUserDevice = user_device[0];
                        user_device_id = firstUserDevice.id;
                        uniqueId = firstUserDevice.unique_id;
                    }
                } else {
                    await createOrUpdateUserDevice();
                    const user_device = await models.user_device.findAll({
                        where: {
                            user_id: user.id
                        },
                        order: [["created_date", "ASC"]]
                    });
                    if (user_device.length > 0) {
                        const firstUserDevice = user_device[0];
                        user_device_id = firstUserDevice.id;
                        uniqueId = firstUserDevice.unique_id;
                    }
                }

                delete user.dataValues.user_device;
                const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                const addressDetail2 = user.address ? user.address.address_detail_2 : null;

                const response = {
                    data_user: {
                        ...user.dataValues,
                        address_detail_1: addressDetail1,
                        address_detail_2: addressDetail2,
                        user_device_id: user_device_id,
                        unique_id: uniqueId
                    },
                    access_token: result.accessToken,
                    refresh_token: result.refreshToken
                };

                res.json(responseSuccess(response, "Đăng nhập thành công!"));
            }
        }

    } catch (err) {
        logger.error('login user', err);
        return next(err);
    }
};


//update
exports.update = async (req, res) => {
    try {
        let id = req.params.id;
        let user = await models.users.findOne({
            where: {
                id: req.user.id,
                status: 1,
                deleted: 0
            }
        });
        if (user.id == id) {
            let data = req.body;
            await userService.update(id, data);
            res.json(responseSuccess({ message: 'Cập nhật thông tin thành công!' }));
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_NOT_ALLOWED, 'Không có quyền truy cập!'));
        }
    } catch (error) {
        logger.error('update user', error);
        res.json(responseWithError(error));
    }
}

//sendVerify
exports.sendVerify = async function (req, res) {
    try {
        const email = req.body.email;
        if (!email) {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_DONT_EXIST, 'Email người dùng không tồn tại!'));
        } else {
            await userService.getByEmail(email).then(async (user) => {
                if (user) {
                    if (user.status == 1 || user.status == 0) {
                        let otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
                        let time = new Date();
                        let timeExpire = new Date();
                        timeExpire.setMinutes(time.getMinutes() + 5);
                        const options = {
                            otp: otp,
                            updated_date: timeExpire,
                            expires: timeExpire
                        };
                        const data = await userService.update(user.id, options);
                        if (data == 1) {
                            const host = req.headers.host;
                            mailService.sendMailVerifyByOTP(host, email, otp, user.user_name);
                            res.json(responseSuccess({ account_status: user.status, id: user.id }));
                        } else {
                            res.json(responseWithError(ErrorCodes.ERROR_CODE_API_NOT_FOUND));
                        }
                    } else {
                        return res.json(responseWithError(ErrorCodes.ERROR_CODE_ACCOUNT_DONT_ACTIVE, 'Tài khoản của bạn chưa được active!'));
                    }
                } else {
                    return res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_DONT_EXIST, 'Email không tồn tại!'));
                }
            }).catch((err) => {
                res.json(responseWithError(err.status, 'error', err.message || ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
            });
        }
    } catch (error) {
        logger.error('sendVerify user', error);
        res.json(responseWithError(error));
    }
};

// Forget_password
exports.forgetPassword = async (req, res, next) => {
    try {
        const request = {
            otp: req.body.otp,
            password: req.body.password
        };
        await userService.forgetPassword(request).then((result) => {
            if (result.message) {
                res.json(responseWithError(ErrorCodes.ERROR_CODE_API_NOT_FOUND));
            } else {
                res.json(responseSuccess());
            }
        }).catch((err) => {
            res.json(responseWithError(err.status, 'error', err.message || ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
        });
    } catch (error) {
        logger.error('forgetPassword user', error);
        res.json(responseWithError(error));
    }
};

// search
exports.search = async (req, res) => {
    try {
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const { limit, offset } = Paginator.getPagination(page, size);
        let { key } = req.query;
        let condition = {
            key,
            limit,
            offset
        };
        await userService.search(condition).then((data) => {
            const response = Paginator.getPagingData(data, page, limit);
            let result = response.rows.map((item) => {
                if (item.avatar !== null) {
                    item.avatar = image_response(item.avatar);
                };
                return item;
            });
            res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: result }))
        }).catch(err => {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
        })
    } catch (err) {
        logger.error('search user', err);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};

// change-password
exports.changePassword = async (req, res) => {
    try {
        const request = {
            password: req.body.password.toString(),
            new_password: req.body.new_password.toString(),
            ...req.user
        }
        const data = await userService.changePassword(request);
        if (!data.message) {
            res.json(responseSuccess(data.message, 'Đổi mật khẩu thành công!'));
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'error', data.message));
        }
    } catch (error) {
        logger.error('changePassword user', error);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', error));
    }
};

//loginwithGoogle 
const signTokens = async (user) => {
    const access_token = await signAccessToken(user);
    const refresh_token = await signRefreshToken(user);
    return { access_token, refresh_token };
};
exports.loginWithGoogle = async (req, res) => {
    try {
        const userData = {
            google_id: req.body.user.id,
            email: req.body.user.email,
            user_name: req.body.user.email,
            full_name: req.body.user.name || `${req.body.user.familyName} ${req.body.user.givenName}`,
            avatar: req.body.user.photo,
            unique_id: req.body.unique_id,
            token_device: req.body.token_device,
            device_name: req.body.device_name,
            status: 1
        };

        let user = await models.users.findOne({
            where: {
                email: userData.email,
                google_id: userData.google_id,
                status: 1,
                deleted: 0
            },
            include: [
                {
                    model: models.address,
                    attributes: { exclude: ["id", "user_id", "created_by", "updated_by", "status", "deleted"] }
                }, {
                    model: models.user_device,
                    attributes: { exclude: ["created_by", "updated_by"] }
                }
            ],
            attributes: { exclude: ["password", "otp", "expires", "created_by", "updated_by"] }
        });

        if (!user) {
            // Tạo user nếu không tồn tại
            user = await models.users.create(userData);
            const self_generated_code = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
            await models.users.update({ self_generated_code: self_generated_code }, { where: { id: user.id } });
            const existingAuthPoint = await models.authenticate_point.findOne({
                where: { user_id: user.id },
            });
            if (!existingAuthPoint) {
                let authenticate_point = 25; // Điểm mặc định khi người dùng đăng ký tài khoản thành công
                let auth_point = {
                    user_id: user.id,
                    authenticate_point: authenticate_point,
                };
                // Tạo bản ghi authenticate_point cho người dùng
                await models.authenticate_point.create(auth_point);
            } else {
                console.log('Người dùng đã được cộng điểm trước đó');
            }
            const userDeviceData = {
                user_id: user.id,
                unique_id: req.body.unique_id,
                token_device: req.body.token_device,
                device_name: req.body.device_name,
            };
            await models.user_device.create(userDeviceData);
            // Lấy user_device sau khi tạo
            const userDevice = await models.user_device.findOne({
                where: {
                    user_id: user.id
                },
                order: [["created_date", "ASC"]]
            });

            // Kiểm tra nếu có user_device
            if (userDevice) {
                const { access_token, refresh_token } = await signTokens(user);
                const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                const responseData = {
                    data_user: {
                        ...user.dataValues,
                        address_detail_1: addressDetail1,
                        address_detail_2: addressDetail2,
                        user_device_id: userDevice.id,
                        unique_id: userDevice.unique_id
                    },
                    access_token,
                    refresh_token
                };
                return res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
            }
        } else {
            let userDevice = await models.user_device.findOne({
                where: {
                    user_id: user.id
                }
            });
            if (!userDevice) {
                // Tạo user_device mới nếu không tồn tại
                userDevice = await models.user_device.create({
                    user_id: user.id,
                    unique_id: req.body.unique_id,
                    token_device: req.body.token_device,
                    device_name: req.body.device_name
                });
                let user_device = await models.user_device.findAll({
                    where: {
                        user_id: user.id
                    },
                    order: [["created_date", "ASC"]]
                });
                const { access_token, refresh_token } = await signTokens(user);
                delete user.dataValues.address
                delete user.dataValues.address_id
                delete user.dataValues.user_device
                const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                if (user_device.length > 0) {
                    const firstUserDevice = user_device[0];
                    user_device = firstUserDevice.id;
                    uniqueId = firstUserDevice.unique_id;
                }
                const responseData = {
                    data_user: {
                        ...user.dataValues,
                        address_detail_1: addressDetail1,
                        address_detail_2: addressDetail2,
                        user_device_id: user_device,
                        unique_id: uniqueId
                    },
                    access_token,
                    refresh_token
                };
                res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
            } else {
                if (userDevice.unique_id !== req.body.unique_id) {
                    const otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
                    const options = contentOTPMail(otp);
                    await models.users.update(options, { where: { id: user.id } });
                    const userDeviceData = {
                        user_id: user.id,
                        unique_id: req.body.unique_id,
                        token_device: req.body.token_device,
                        device_name: req.body.device_name,
                    };
                    await models.user_device.create(userDeviceData);
                    let user_device = await models.user_device.findAll({
                        where: {
                            user_id: user.id
                        },
                        order: [["created_date", "ASC"]]
                    });
                    const firstUserDevice = user_device[0];
                    const firstUserId = firstUserDevice.user_id;
                    const payload = {
                        notifications: {
                            title: `Yêu cầu đăng nhập`,
                            body: `Đã có yêu cầu đăng nhập bằng ID Google ${user.email}`,
                            name: `Đã có yêu cầu đăng nhập bằng ID Google ${user.email}`,
                            otp: `${otp}`,
                            content: `Đã có yêu cầu đăng nhập bằng ID Google ${user.email} trên thiết bị có tên là: ${req.body.device_name}`,
                            type_id: firstUserId.toString(),
                            type: "7",
                            user_id: firstUserId.toString()
                        }
                    };
                    const noti = await notiService.create(payload.notifications);
                    // sendMessage(firstUserId, payload.notifications, noti.id);
                    const { access_token, refresh_token } = await signTokens(user);
                    delete user.dataValues.address
                    delete user.dataValues.address_id
                    delete user.dataValues.user_device
                    const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                    const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                    if (user_device.length > 0) {
                        const firstUserDevice = user_device[0];
                        user_device = firstUserDevice.id;
                        uniqueId = firstUserDevice.unique_id;
                    }
                    const responseData = {
                        data_user: {
                            ...user.dataValues,
                            address_detail_1: addressDetail1,
                            address_detail_2: addressDetail2,
                            user_device_id: user_device,
                            unique_id: uniqueId
                        },
                        access_token,
                        refresh_token
                    };
                    res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
                } else if (userDevice.unique_id === req.body.unique_id) {
                    // Cập nhật thời gian và token_device
                    const updatedUserDeviceData = {
                        token_device: req.body.token_device,
                        created_date: new Date(),
                    };
                    await models.user_device.update(updatedUserDeviceData, {
                        where: {
                            user_id: user.id,
                        },
                    });
                    // Lấy thông tin user_device sau khi cập nhật
                    const updatedUserDevice = await models.user_device.findOne({
                        where: {
                            user_id: user.id,
                        },
                        order: [["created_date", "ASC"]],
                    });
                    const { access_token, refresh_token } = await signTokens(user);
                    delete user.dataValues.address
                    delete user.dataValues.address_id
                    delete user.dataValues.user_device
                    const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                    const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                    const responseData = {
                        data_user: {
                            ...user.dataValues,
                            address_detail_1: addressDetail1,
                            address_detail_2: addressDetail2,
                            user_device_id: updatedUserDevice.id,
                            unique_id: updatedUserDevice.unique_id,
                        },
                        access_token,
                        refresh_token,
                    };
                    res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
                }
            }
        }
    } catch (error) {
        logger.error('login-with-google user', error);
        res.json(responseWithError(error));
    }
}

//CheckOTP
exports.checkOTP = async (req, res) => {
    try {
        if (req.body.otp != null || req.body.otp != undefined) {
            const data = await userService.updateOTPUser(req.body);
            if (data == true) {
                const existingAuthPoint = await models.authenticate_point.findOne({
                    where: { user_id: req.body.id },
                });
                if (!existingAuthPoint) {
                    let authenticate_point = 25; // Điểm mặc định khi người dùng đăng ký tài khoản thành công
                    let auth_point = {
                        user_id: req.body.id,
                        authenticate_point: authenticate_point,
                    };
                    // Tạo bản ghi authenticate_point cho người dùng
                    await models.authenticate_point.create(auth_point);
                } else {
                    console.log('Người dùng đã được cộng điểm trước đó');
                }
                res.json(responseSuccess({ id: req.body.id }, { message: "Bạn đã active tài khoản thành công" }));
            } else {
                res.json(responseWithError(ErrorCodes.ERROR_CODE_OTP_DONT_EXIST, 'OTP không đúng!'));
            }
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ACCOUNT_DONT_ACTIVE, 'Tài khoản chưa được active!'));
        }
    }
    catch (err) {
        logger.error('checkOTP user', err);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};

//refreshToken
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.body.refresh_token;
        if (!refreshToken) {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST));
        } else {
            const user = await checkRefreshToken(refreshToken);
            if (user.message) {
                res.json(responseWithError(ErrorCodes.ERROR_CODE_FORBIDDEN, user.message));
            } else {
                const new_accessToken = await signAccessToken(user);
                const new_refreshToken = await signRefreshToken(user);
                const data = {
                    access_token: new_accessToken,
                    refresh_token: new_refreshToken
                };
                res.json(responseSuccess(data));
            }
        };
    } catch (err) {
        logger.error('refreshToken user', err);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
};

//loginWithApple
const client = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' });
function getAppleSigningKey(kid) {
    return new Promise(resolve => {
        client.getSigningKey(kid, async (err, key) => {
            if (err) {
                resolve(null)
                return
            }
            const signingKey = key.publicKey;
            resolve(signingKey)
        })
    })
};
function verifyJWT(json, publicKey) {
    return new Promise((resolve, reject) => {
        jwt.verify(json, publicKey, (err, payload) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(payload);
        });
    });
};

//loginWithApple
exports.loginWithApple = async (req, res) => {
    try {
        const json = jwt.decode(req.body.access_token, { complete: true });
        const kid = json?.header?.kid;
        const appleKey = await getAppleSigningKey(kid);
        if (!appleKey) {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_APPLE_INVALID, 'AppleKey không hợp lệ!'));
        } else {
            const payload = await verifyJWT(req.body.access_token, appleKey);
            if (payload.sub) {
                if (payload.sub == json.payload.sub) {
                    let user = await models.users.findOne({
                        where: {
                            apple_id: payload.sub,
                        },
                        attributes: { exclude: ["password", "otp", "expires", "created_by", "updated_by"] }
                    });
                    const userData = {
                        apple_id: payload.sub,
                        email: payload.email,
                        full_name: payload.email,
                        unique_id: req.body.unique_id,
                        token_device: req.body.token_device,
                        device_name: req.body.device_name,
                        status: 1
                    };
                    if (!user) {
                        user = await models.users.create(userData);
                        const self_generated_code = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
                        await models.users.update({ self_generated_code: self_generated_code }, { where: { id: user.id } });
                        const existingAuthPoint = await models.authenticate_point.findOne({
                            where: { user_id: user.id },
                        });
                        if (!existingAuthPoint) {
                            let authenticate_point = 25; // Điểm mặc định khi người dùng đăng ký tài khoản thành công
                            let auth_point = {
                                user_id: user.id,
                                authenticate_point: authenticate_point,
                            };
                            // Tạo bản ghi authenticate_point cho người dùng
                            await models.authenticate_point.create(auth_point);
                        } else {
                            console.log('Người dùng đã được cộng điểm trước đó');
                        }
                        const userDeviceData = {
                            user_id: user.id,
                            unique_id: req.body.unique_id,
                            token_device: req.body.token_device,
                            device_name: req.body.device_name,
                        };
                        await models.user_device.create(userDeviceData);
                        // Lấy user_device sau khi tạo
                        const userDevice = await models.user_device.findOne({
                            where: {
                                user_id: user.id
                            },
                            order: [["created_date", "ASC"]]
                        });
                        // Kiểm tra nếu có user_device
                        if (userDevice) {
                            const { access_token, refresh_token } = await signTokens(user);
                            const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                            const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                            const responseData = {
                                data_user: {
                                    ...user.dataValues,
                                    address_detail_1: addressDetail1,
                                    address_detail_2: addressDetail2,
                                    user_device_id: userDevice.id,
                                    unique_id: userDevice.unique_id
                                },
                                access_token,
                                refresh_token
                            };
                            return res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
                        }
                    } else {
                        let userDevice = await models.user_device.findOne({
                            where: {
                                user_id: user.id
                            }
                        });
                        if (!userDevice) {
                            // Tạo user_device mới nếu không tồn tại
                            userDevice = await models.user_device.create({
                                user_id: user.id,
                                unique_id: req.body.unique_id,
                                token_device: req.body.token_device,
                                device_name: req.body.device_name
                            });
                            let user_device = await models.user_device.findAll({
                                where: {
                                    user_id: user.id
                                },
                                order: [["created_date", "ASC"]]
                            });
                            const { access_token, refresh_token } = await signTokens(user);
                            delete user.dataValues.address
                            delete user.dataValues.address_id
                            delete user.dataValues.user_device
                            const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                            const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                            if (user_device.length > 0) {
                                const firstUserDevice = user_device[0];
                                user_device = firstUserDevice.id;
                                uniqueId = firstUserDevice.unique_id;
                            }
                            const responseData = {
                                data_user: {
                                    ...user.dataValues,
                                    address_detail_1: addressDetail1,
                                    address_detail_2: addressDetail2,
                                    user_device_id: user_device,
                                    unique_id: uniqueId
                                },
                                access_token,
                                refresh_token
                            };
                            res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
                        } else {
                            if (userDevice.unique_id !== req.body.unique_id) {
                                const otp = Math.floor(100000 + Math.random() * 900000).toString().slice(0, 6);
                                const options = contentOTPMail(otp);
                                await models.users.update(options, { where: { id: user.id } });
                                const userDeviceData = {
                                    user_id: user.id,
                                    unique_id: req.body.unique_id,
                                    token_device: req.body.token_device,
                                    device_name: req.body.device_name,
                                };
                                await models.user_device.create(userDeviceData);
                                let user_device = await models.user_device.findAll({
                                    where: {
                                        user_id: user.id
                                    },
                                    order: [["created_date", "ASC"]]
                                });
                                const firstUserDevice = user_device[0];
                                const firstUserId = firstUserDevice.user_id;
                                const payload = {
                                    notifications: {
                                        title: `Yêu cầu đăng nhập`,
                                        body: `Đã có yêu cầu đăng nhập bằng ID Apple ${user.email}`,
                                        name: `Đã có yêu cầu đăng nhập bằng ID Apple ${user.email}`,
                                        otp: `${otp}`,
                                        content: `Đã có yêu cầu đăng nhập bằng ID Apple ${user.email} trên thiết bị có tên là: ${req.body.device_name}`,
                                        type_id: firstUserId.toString(),
                                        type: "7",
                                        user_id: firstUserId.toString()
                                    }
                                };
                                const noti = await notiService.create(payload.notifications);
                                // sendMessage(firstUserId, payload.notifications, noti.id);
                                const { access_token, refresh_token } = await signTokens(user);
                                delete user.dataValues.address
                                delete user.dataValues.address_id
                                delete user.dataValues.user_device
                                const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                                const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                                if (user_device.length > 0) {
                                    const firstUserDevice = user_device[0];
                                    user_device = firstUserDevice.id;
                                    uniqueId = firstUserDevice.unique_id;
                                }
                                const responseData = {
                                    data_user: {
                                        ...user.dataValues,
                                        address_detail_1: addressDetail1,
                                        address_detail_2: addressDetail2,
                                        user_device_id: user_device,
                                        unique_id: uniqueId
                                    },
                                    access_token,
                                    refresh_token
                                };
                                res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
                            } else if (userDevice.unique_id === req.body.unique_id) {
                                // Cập nhật thời gian và token_device
                                const updatedUserDeviceData = {
                                    token_device: req.body.token_device,
                                    created_date: new Date(),
                                };
                                await models.user_device.update(updatedUserDeviceData, {
                                    where: {
                                        user_id: user.id,
                                    },
                                });
                                // Lấy thông tin user_device sau khi cập nhật
                                const updatedUserDevice = await models.user_device.findOne({
                                    where: {
                                        user_id: user.id,
                                    },
                                    order: [["created_date", "ASC"]],
                                });
                                const { access_token, refresh_token } = await signTokens(user);
                                delete user.dataValues.address
                                delete user.dataValues.address_id
                                delete user.dataValues.user_device
                                const addressDetail1 = user.address ? user.address.address_detail_1 : null;
                                const addressDetail2 = user.address ? user.address.address_detail_2 : null;
                                const responseData = {
                                    data_user: {
                                        ...user.dataValues,
                                        address_detail_1: addressDetail1,
                                        address_detail_2: addressDetail2,
                                        user_device_id: updatedUserDevice.id,
                                        unique_id: updatedUserDevice.unique_id,
                                    },
                                    access_token,
                                    refresh_token,
                                };
                                res.json(responseSuccess(responseData, "Đăng nhập thành công!"));
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        logger.error('login with apple', err);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_API_NOT_FOUND, 'ERROR', err));
    }
};

//authenticate
exports.authenticate = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await models.users.findOne({
            where: {
                id: userId,
                status: 1,
                deleted: 0
            }
        });
        if (!user) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Người dùng không tồn tại!'));
        } else {
            let existingAddress = await models.address.findOne({
                where: {
                    user_id: userId
                }
            });
            // Kiểm tra xem người dùng đã có địa chỉ chưa
            if (existingAddress) {
                let data = {
                    address_detail_1: {
                        unit: req.body.address_detail_1.unit,
                        ward: req.body.address_detail_1.ward,
                        district: req.body.address_detail_1.district,
                        city: req.body.address_detail_1.city
                    },
                    address_detail_2: {
                        unit: req.body.address_detail_2.unit,
                        ward: req.body.address_detail_2.ward,
                        district: req.body.address_detail_2.district,
                        city: req.body.address_detail_2.city
                    }
                }
                if (data.address_detail_1) {
                    data.address_detail_1.detail = `${data.address_detail_1.unit}, ${data.address_detail_1.ward.name}, ${data.address_detail_1.district.name}, ${data.address_detail_1.city.name}`
                }
                if (data.address_detail_2) {
                    data.address_detail_2.detail = `${data.address_detail_2.unit}, ${data.address_detail_2.ward.name}, ${data.address_detail_2.district.name}, ${data.address_detail_2.city.name}`
                }
                await models.address.update(data, {
                    where: {
                        user_id: userId
                    }
                });
            } else {
                // Nếu người dùng chưa có địa chỉ, tạo mới địa chỉ
                let address = {
                    user_id: userId,
                    address_detail_1: {
                        unit: req.body.address_detail_1.unit,
                        ward: req.body.address_detail_1.ward,
                        district: req.body.address_detail_1.district,
                        city: req.body.address_detail_1.city
                    },
                    address_detail_2: {
                        unit: req.body.address_detail_2.unit,
                        ward: req.body.address_detail_2.ward,
                        district: req.body.address_detail_2.district,
                        city: req.body.address_detail_2.city
                    }
                };
                if (address.address_detail_1) {
                    address.address_detail_1.detail = `${address.address_detail_1.unit}, ${address.address_detail_1.ward.name}, ${address.address_detail_1.district.name}, ${address.address_detail_1.city.name}`
                }
                if (address.address_detail_2) {
                    address.address_detail_2.detail = `${address.address_detail_2.unit}, ${address.address_detail_2.ward.name}, ${address.address_detail_2.district.name}, ${address.address_detail_2.city.name}`
                }
                existingAddress = await models.address.create(address);
            }
            let data = {
                id: userId,
                type_certificate_identify: req.body.type_certificate_identify,
                certificate_identify: req.body.certificate_identify,
                date_range: req.body.date_range,
                front_photo: req.body.front_photo,
                back_side_photo: req.body.back_side_photo,
                issued_by: req.body.issued_by,
                address_id: existingAddress.id.toString(),
                is_authenticated: 1,
                updated_date: new Date(),
                contact_person_name_1: req.body.contact_person_name_1,
                relationship_1: req.body.relationship_1,
                contact_person_phone_number_1: req.body.contact_person_phone_number_1,
                contact_person_name_2: req.body.contact_person_name_2,
                relationship_2: req.body.relationship_2,
                contact_person_phone_number_2: req.body.contact_person_phone_number_2,
                bank_id: req.body.bank_id,
                bank_account_name: req.body.bank_account_name,
                account_name: req.body.account_name
            }
            await models.users.update(data, { where: { id: user.id } });
            let result = await models.users.findOne({
                where: {
                    id: userId
                },
                attributes: ["id", "type_certificate_identify", "certificate_identify", "address_id", "date_range", "front_photo", "back_side_photo", "issued_by", "is_authenticated", "updated_date"],
                include: [{
                    model: models.address,
                    attributes: ["id", "address_detail_1", "address_detail_2"]
                }]
            })
            res.json(responseSuccess(result, 'Xác thực thành công!'));
        }
    } catch (error) {
        logger.error('authenticate user', error);
        res.json(responseWithError(error));
    }
};

//acceptAuthenticate
exports.acceptAuthenticate = async (req, res) => {
    try {
        let data = {
            is_authenticated: req.body.is_authenticated,
            updated_date: new Date()
        }
        let id = req.params.id;
        let user = await models.users.findOne({
            where: {
                id: id,
                status: 1,
                deleted: 0
            }
        });
        if (user) {
            await userService.update(id, data);
            const optionStatus = (item) => {
                switch (item) {
                    case 2:
                        return "Tài khoản của bạn đang được xác thực";
                    case 3:
                        return "Tài khoản của bạn đã được xác thực";
                    default:
                        break;
                }
            };
            const payload = {
                notifications: {
                    title: `Cập nhật trạng thái xác thực tài khoản!!!`,
                    body: `${optionStatus(data.is_authenticated)}`,
                    name: `Cập nhật trạng thái xác thực tài khoản`,
                    content: `${optionStatus(data.is_authenticated)}`,
                    type_id: user.id.toString(),
                    type: "5",
                    deep_link: `${host.host_deeplink}${host.api_deeplink.users}${user.id}`,
                    user_id: user.id.toString()
                }
            };
            const noti = await notiService.create(payload.notifications);
            notiFcm(user.id, payload.notifications, noti.id);
            if (data.is_authenticated == 3) {
                // Kiểm tra xem người dùng đã được cộng điểm trước đó chưa
                let result = await models.authenticate_point.findOne({
                    where: {
                        user_id: user.id
                    }
                });
                if (!result) {
                    // Nếu chưa có dòng dữ liệu cho người dùng này, thì cộng điểm
                    let authenticate_point = 50; // Điểm mặc định khi người dùng được xác thực thông tin thành công
                    let auth_point = {
                        user_id: user.id,
                        authenticate_point: authenticate_point
                    };
                    await models.authenticate_point.create(auth_point);
                } else {
                    // Nếu đã có dòng dữ liệu cho người dùng này, cập nhật điểm
                    if (result.authenticate_point_count < 1) {
                        let newAuthenticatePoint = result.authenticate_point + 50; // Cộng thêm 50 điểm
                        await models.authenticate_point.update(
                            { authenticate_point: newAuthenticatePoint, authenticate_point_count: result.authenticate_point_count + 1 },
                            {
                                where: {
                                    user_id: user.id
                                }
                            }
                        );
                    };
                };
            };
            res.json(responseSuccess());
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Người dùng không tồn tại!'));
        }
    } catch (error) {
        logger.error('accept authenticate', error);
        res.json(responseWithError(error));
    }
};

//add-Info
exports.addInfor = async (req, res) => {
    try {
        const id = req.params.id;
        let data = {
            full_name: req.body.full_name,
            dob: req.body.dob,
            gender: req.body.gender,
            referral_code: req.body.referral_code
        };
        const user = await models.users.findOne({
            where: {
                id: id,
                status: 1,
                deleted: 0
            }
        });
        if (user) {
            if (data.referral_code) {
                const referringUser = await models.users.findOne({
                    where: {
                        self_generated_code: data.referral_code,
                        status: 1,
                        deleted: 0
                    }
                });
                if (referringUser) {
                    if (referringUser.referral_code_usage_count < 3) {
                        let result = await models.authenticate_point.findOne({
                            where: {
                                user_id: user.id
                            }
                        });
                        if (result) {
                            let newAuthenticatePoint = result.authenticate_point + 5; //Điểm mặc định được cộng khi giới thiệu người mới đăng ký app
                            await models.authenticate_point.update({ authenticate_point: newAuthenticatePoint }, {
                                where: {
                                    user_id: user.id
                                }
                            });
                            let auth = await models.authenticate_point.findOne({
                                where: {
                                    user_id: referringUser.id
                                }
                            });
                            let newAuthPoint = auth.authenticate_point + 5
                            await models.authenticate_point.update({ authenticate_point: newAuthPoint }, {
                                where: {
                                    user_id: referringUser.id
                                }
                            });
                            const payload = {
                                notifications: {
                                    title: `Thông báo tặng điểm tín dụng khi giới thiệu app`,
                                    body: ``,
                                    name: `Thông báo tặng điểm tín dụng khi giới thiệu app`,
                                    content: `Chúc mừng ${referringUser.full_name} đã được cộng 5 điểm tín dụng khi giới thiệu người mới đăng ký app. Hãy kiểm tra lịch sử điểm`,
                                    type_id: referringUser.id.toString(),
                                    type: "5",
                                    deep_link: `${host.host_deeplink}${host.api_deeplink.users}${referringUser.id}`,
                                    user_id: referringUser.id.toString()
                                }
                            };
                            const noti = await notiService.create(payload.notifications);
                            notiFcm(referringUser.id, payload.notifications, noti.id);
                            await models.users.update({ referral_code_usage_count: referringUser.referral_code_usage_count + 1 }, {
                                where: {
                                    self_generated_code: data.referral_code
                                }
                            });
                        }
                    } else {
                        return res.json(responseWithError(ErrorCodes.ERROR_CODE_REFERRAL_CODE_LIMIT, 'Đã đạt giới hạn số lần chia sẻ!'));
                    }
                } else {
                    return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Mã giới thiệu không tồn tại'));
                }
            };
            await models.users.update(data, { where: { id: user.id } });
            res.json(responseSuccess({ message: 'Bổ sung thông tin thành công!' }));
        } else {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Người dùng không tồn tại!'));
        }
    } catch (error) {
        logger.error('addInfor user', error);
        res.json(responseWithError(error));
    }
};

//verifyOTP
async function notiT2(user_id, data, id) {
    try {
        const data_device = await models.user_device.findAll({
            where: {
                user_id: user_id
            }
        });
        if (data_device === null) {
            return [];
        } else {
            const firstUserDevice = data_device[0];
            const firebaseToken = firstUserDevice.token_device;
            const payload = {
                notification: {
                    title: data.title,
                    body: data.body
                },
                data: {
                    id: id.toString(),
                    ...data
                }
            };
            const response = await admin.messaging().sendToDevice(firebaseToken, payload);
            return response;
        }
    } catch (error) {
        throw error;
    }
}

//verifyOTP-dùng để làm xác thực đăng nhập trên thiết bị lạ
exports.verifyOTP = async (req, res) => {
    try {
        if (req.body.otp != null && req.body.otp != undefined) {
            const user = await userService.findByOTP(req.body);
            if (user) {
                let user_device = await models.user_device.findAll({
                    where: {
                        user_id: user.id
                    },
                    order: [["created_date", "DESC"]]
                });
                if (user_device.length > 0) {
                    const firstUserDevice = user_device[0];
                    const firstUserId = firstUserDevice.user_id;
                    const firstUserDeviceName = firstUserDevice.device_name;
                    const payload = {
                        notifications: {
                            title: `Thông báo xác thực thành công`,
                            body: `Tài khoản đã đăng nhập thành công trên thiết bị có tên là: ${firstUserDeviceName}`,
                            name: `Tài khoản đã đăng nhập thành công trên thiết bị có tên là: ${firstUserDeviceName}`,
                            content: `Tài khoản đã đăng nhập thành công trên thiết bị có tên là: ${firstUserDeviceName}`,
                            type_id: firstUserId.toString(),
                            type: "7",
                            user_id: firstUserId.toString()
                        }
                    };
                    const noti = await notiService.create(payload.notifications);
                    await notiT2(firstUserId, payload.notifications, noti.id);
                    if (user_device.length > 1) {
                        const shiftedDevice = user_device.pop();
                        await models.user_device.destroy({
                            where: {
                                id: shiftedDevice.id
                            }
                        });
                    }
                    res.json(responseSuccess(user_device.message, 'Đăng nhập trên thiết bị mới thành công!'));
                } else {
                    res.json(responseWithError(ErrorCodes.ERROR_CODE_DEVICE_NOT_FOUND, 'Không tìm thấy thiết bị!'));
                }
            } else {
                res.json(responseWithError(ErrorCodes.ERROR_CODE_OTP_DONT_EXIST, 'OTP không tồn tại!'));
            }
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_OTP_DONT_EXIST, 'OTP không tồn tại!'));
        }
    } catch (error) {
        logger.error('verifyOTP', error);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_CUSTOM, 'Có lỗi xảy ra!'));
    }
};



//deleteUser
exports.deleteUser = async (req, res) => {
    try {
        const user_id = req.user.id;
        let user = await models.users.findOne({
            where: {
                id: user_id,
                status: 1,
                deleted: 0
            }
        });
        if (user.google_id || user.apple_id) {
            let data = await models.users.update({ deleted: 1 }, { where: { id: user.id } });
            res.json(responseSuccess(data.message, 'Xoá tài khoản thành công!'));
        } else {
            let data = {
                password: req.body.password
            };
            const passwordMatch = await bcrypt.compare(data.password, user.password);
            if (!passwordMatch) {
                return res.json(responseWithError(passwordMatch.message, 'Mật khẩu không chính xác!'))
            };
            let result = await models.users.update({ deleted: 1 }, { where: { id: user.id } });
            res.json(responseSuccess(result.message, 'Xoá tài khoản thành công!'));
        }
    } catch (error) {
        logger.error('delete User', error);
        res.json(responseWithError(error));
    }
}

// exports.deleteUser = async(req, res) => {
//     try {
//         const user_id = req.user.id;
//         let user = await models.users.findOne({
//             where: {
//                 id: user_id,
//                 status: 1,
//                 deleted: 0
//             }
//         });
//         if (!user) {
//             return res.json(responseWithError('Không tìm thấy người dùng.'));
//         }
//         const isPasswordProvided = req.body.password;
//         if (!isPasswordProvided) {
//             return res.json(responseWithError('Vui lòng cung cấp mật khẩu để xác nhận.'));
//         };
//         const dependentTables = [
//             'address',
//             'authenticate_point',
//             'borrower_information',
//             'car_buying_selling_point',
//             'credit_point',
//             'loan_application',
//             'loan_information',
//             'notification',
//             'message',
//             'order',
//             'payment',
//             'point',
//             'service_point',
//             'transaction',
//             'user_device',
//         ];
//         const transaction = await models.sequelize.transaction();
//         try {
//             // Nếu tài khoản không có google_id hoặc apple_id, hoặc người dùng cung cấp mật khẩu đúng
//             if (isPasswordProvided) {
//                 // Sử dụng Promise.all để thực hiện song song các truy vấn trong giao dịch
//                 await Promise.all([
//                     // Cập nhật trường `deleted` của các bản ghi trong các bảng phụ thuộc
//                     ...dependentTables.map(async (tableName) => {
//                         await models[tableName].update({ deleted: 1 }, {
//                             where: {
//                                 user_id: user.id
//                             },
//                             transaction
//                         });
//                     }),
//                     // Cập nhật trường `deleted` của người dùng
//                     // user.update({ deleted: 1 }, { transaction })
//                 ]);

//                 // Hoàn thành giao dịch
//                 await transaction.commit();

//                 return res.json(responseSuccess('Xoá tài khoản thành công!'));
//             } else {
//                 return res.json(responseWithError('Mật khẩu không chính xác.'));
//             }
//         } catch (error) {
//             // Nếu có lỗi, rollback giao dịch
//             await transaction.rollback();
//             throw error;
//         }
//     } catch (error) {
//         logger.error('delete User', error);
//         res.json(responseWithError(error));
//     }
// }