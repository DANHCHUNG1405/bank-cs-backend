const models = require("../../../models");
const messageConstants = require("../../constant/messageConstants");
const bcrypt = require('bcryptjs');
const { Op } = require("sequelize");
const jwt_token = require("../../middlewares/jwt_token");
const { ErrorCodes } = require('../../helper/constants');

// Find All By Paging
exports.getAllPaging = (data) => {
    let condition = {
        deleted: 0,
        status: 1
    };
    if (data.query.role) {
        condition.role = data.query.role
    }
    return models.users.findAndCountAll({
        where: condition,
        attributes: ['id', 'full_name', 'gender', 'dob', 'company','address','role', 'phone', 'email', 'avatar', 'deleted', 'status'],
        include: [{
            model: models.members,
            attributes: ["id", "group_id"],
            include: [{
                model: models.groups,
                attributes: ["id", "name"]
            }]
        }],
        limit: data.limit,
        offset: data.offset
    });
};


//find by id
exports.getById = async (id) => {
    return await models.users.findOne({
        where: {
            id: id,
            deleted: 0
        },
        attributes: {exclude:["status", "deleted", "password", "created_by", "updated_by", "otp", "expires", "type_certificate_identify", "certificate_identify", "date_range", "front_photo", "back_side_photo", "issued_by", "google_id", "apple_id", "facebook_id", "role"]},
        include: [{
            model: models.address,
            attributes: {exclude: ["id","user_id","created_by", "updated_by", "status", "deleted"]}
        }]
    })
};


//update
exports.update = async (id, data) => {
    return await models.users.update(data, {
        where: {
            id: id,
            deleted: 0,
        }
    })
};

//login
exports.login = async (account) => {
    let condition = {
        deleted: 0,
        status: 1
    };
    condition = {
        ...condition,
        [Op.or]: {
            email: account.user_name,
            phone: account.user_name
        }
    };
    const user = await models.users.findOne({ where: condition });
    if (user) {
        if (user.password != null) {
            const isMatch = await bcrypt.compare(account.password, user.password)
            if (isMatch) {
                if (user.status == 1) {
                    const accessToken = jwt_token.signAccessToken(user);
                    const refreshToken = jwt_token.signRefreshToken(user);
                    return { accessToken, refreshToken, user };
                } else {
                    return Promise.resolve({
                        message: messageConstants.USER_NOT_ACTIVE,
                    });
                }
            }
            else {
                return Promise.resolve({
                    message: messageConstants.USER_PASS_INVALID,
                });
            }
        } else {
            const isMatch = await bcrypt.compare(account.user_name, user.email)
            if (isMatch) {
                if (user.status == 1) {
                    const accessToken = jwt_token.signAccessToken(user);
                    const refreshToken = jwt_token.signRefreshToken(user);
                    return { accessToken, refreshToken, user };
                } else {
                    return Promise.resolve({
                        message: messageConstants.USER_NOT_ACTIVE,
                    });
                }
            }
            else {
                return Promise.resolve({
                    message: messageConstants.USER_PASS_INVALID,
                });
            }
        }
    } else {
        return Promise.resolve({
            message: messageConstants.USER_USERNAME_NOT_EXIST,
        });
    }
};


//register
exports.register = async (user) => {
    const createInfo = async () => {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(user.password, salt);
        user.password = hashPassword;
        return models.users.create(user);
    }
    try {
        // Bắt buộc phải có email hoặc phone
        if (!user.email && !user.phone) {
            return { status: ErrorCodes.ERROR_CODE_API_BAD_REQUEST, message: "Email hoặc phone là bắt buộc!" };
        }
        let user_email;
        if (user.email) {
            user_email = await models.users.findOne({
                where: {
                    deleted: 0,
                    email: user.email
                }
            });
        } else if (user.phone) {
            user_email = await models.users.findOne({
                where: {
                    deleted: 0,
                    phone: user.phone
                }
            });
        }
        if (user_email == null || user_email == undefined) {
            const createdUser = await createInfo();
            return { id: createdUser.id, ...user };
        } else if (user_email.status == 0) {
            const existingUser = await models.users.findOne({
                where: { email: user.email } || { phone: user.phone },
                deleted: 0
            });
            if (existingUser) {
                await models.user_device.destroy({ where: { user_id: existingUser.id } });
                await models.users.destroy({ where: { email: user.email } || { phone: user.phone } });
            }
            const createdUser = await createInfo();
            return { id: createdUser.id, ...user };
        } else if (user_email.status == 1) {
            return { status: ErrorCodes.ERROR_CODE_EMAIL_EXIST, message: messageConstants.USER_EXIST };
        } else {
            return { status: ErrorCodes.ERROR_CODE_EMAIL_EXIST, message: messageConstants.USER_EXIST };
        }
    } catch (error) {
        throw error; // Ném lỗi để xử lý tại nơi gọi hàm
    }
};


//find by email
exports.getByEmail = async (email) => {
    const user = await models.users.findOne({ where: { email: email, deleted: false } });
    if (user) {
        return user;
    } else {
        return null;
    };
};

//delete
exports.delete = async (id, options) => {
    return models.users.update(options, { where: { id: id, deleted: 0 } });
}

//restore
exports.restore = async (id, options) => {
    return models.users.update(options, { where: { id: id, deleted: 1 } });
};

// Forget-Password
exports.forgetPassword = async (account) => {
    const user = await models.users.findOne({ where: { otp: account.otp } });
    if (user) {
        const date = await models.users.findOne({ where: { expires: { [Op.gte]: new Date() } } });
        if (date) {
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(account.password, salt);
            account.password = hashPassword;
            const options = { password: account.password, update_date: new Date() };
            return models.users.update(options, { where: { id: user.id } });
        } else {
            return Promise.resolve({
                message: messageConstants.EMAIL_DATE_EXPIRED,
            });
        }
    } else {
        return Promise.resolve({
            message: messageConstants.USER_USERNAME_NOT_EXIST,
        });
    }
};

//create (admin create user)
exports.create = async (obj) => {
    const data = {
        user_name: obj.user_name,
        full_name: obj.full_name,
        relative_id: obj.relative_id,
        VGA: obj.VGA,
        email: obj.email,
        phone: obj.phone,
        dob: obj.dob,
        avatar: obj.avatar,
        specialize: obj.specialize,
        company: obj.company,
        career: obj.career,
        gender: obj.gender,
        password: obj.password,
        status: 1
    }
    const userPhone = await models.users.findOne({ where: { phone: data.phone, deleted: false } })
    if (!userPhone) {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(data.password, salt);
        data.password = hashPassword;
        const user = await models.users.create(data);
        return user;
    } else {
        return Promise.resolve({
            message: messageConstants.USER_PHONE_EXIST,
        });
    };

};


// search 
exports.search = (data) => {
    let condition = {
        deleted: 0,
        status: 1,
        [Op.or]: [
            { email: { [Op.like]: "%" + data.key + "%" } },
            { phone: { [Op.like]: "%" + data.key + "%" } },
            { full_name: { [Op.like]: "%" + data.key + "%" } }
        ]
    };
    return models.users.findAndCountAll({
        where: condition,
        attributes: [
            'id',
            'phone',
            'email',
            'address_id',
            'full_name',
            'gender',
            'dob',
            'avatar',
            'deleted',
            'status',
            'created_date'
        ],
        limit: data.limit,
        offset: data.offset
    });
};


//changePassword
exports.changePassword = async (request) => {
    const user = await models.users.findOne({
        where: {
            email: request.email,
            deleted: 0,
            status: 1,
        }
    });
    if (user) {
        const isMatch = await bcrypt.compare(request.password, user.password)
        if (isMatch) {
            const isMatch2 = await bcrypt.compare(request.new_password, user.password);
            if (!isMatch2) {
                const salt = await bcrypt.genSalt(10);
                const hashPassword = await bcrypt.hash(request.new_password, salt);
                request.new_password = hashPassword;
                const options = {
                    password: request.new_password,
                    updated_date: new Date()
                };
                return models.users.update(options, {
                    where: {
                        id: user.id,
                        deleted: 0,
                        status: 1
                    }
                });
            } else {
                return Promise.resolve({ message: messageConstants.USER_NEW_PASSWORD_SAME_OLD_PASSWORD });
            }
        } else {
            return Promise.resolve({ message: messageConstants.USER_PASS_INVALID });
        }
    } else {
        return Promise.resolve({ message: messageConstants.USER_USERNAME_NOT_EXIST });
    }
};

//checkOTP
exports.updateOTPUser = async (request) => {
    var option = {
        field: 'status',
        status: 1,
        updated_date: new Date()
    }
    const user = await models.users.findOne({
        where: {
            id: request.id,
            otp: request.otp
        }
    });
    if (user) {
        const date = await models.users.findOne({
            where: {
                expires: {
                    [Op.gte]: new Date()
                }
            }
        });
        if (date) {
            return models.users.update(option, { where: { id: user.id, deleted: 0 } });
        } else {
            return Promise.resolve({ status: ErrorCodes.ERROR_CODE_API_NOT_FOUND, message: messageConstants.USER_VERIFY_DATE_EXPIRED });
        }
    } else {
        return Promise.resolve({ message: messageConstants.USER_USERNAME_NOT_EXIST });
    }
};

//FindByOTP
exports.findByOTP = async (data) => {
    let condition = {
        deleted: 0,
        status: 1,
    };
    if (data.otp) {
        condition = {
            deleted: 0,
            status: 1,
            otp: data.otp,
            id: data.id
        }
    }
    return models.users.findOne({
        where: condition
    });
};
