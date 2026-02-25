'use strict';
const { Sequelize, DataTypes, STRING } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    let users = sequelize.define('users', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        address_id: {
            type: Sequelize.INTEGER(4)
        },
        bank_id: {
            type: Sequelize.INTEGER(4)
        },
        full_name: {
            type: Sequelize.STRING(255)
        },
        bank_account_name: {
            type: Sequelize.STRING(255)
        },
        account_name: {
            type: Sequelize.STRING(255)
        },
        password: {
            type: Sequelize.STRING(255)
        },
        gender: {
            type: Sequelize.INTEGER(2)
        },
        dob: {
            type: Sequelize.DATE
        },
        email: {
            type: Sequelize.STRING(255)
        },
        phone: {
            type: Sequelize.STRING(15)
        },
        avatar: {
            type: Sequelize.TEXT('long')
        },
        cover_image: {
            type: Sequelize.TEXT('long')
        },
        type_certificate_identify: {
            type: Sequelize.INTEGER(2)
            //loại căn cước công dân
        },
        certificate_identify: {
            type: Sequelize.STRING(20)
            //số căn cước công dân
        },
        date_range: {
            type: Sequelize.DATE
            //ngày cấp CCD/CMTND
        },
        front_photo: {
            type: Sequelize.TEXT('long')
            //ảnh mặt trước
        },
        back_side_photo: {
            type: Sequelize.TEXT('long')
            //ảnh mặt sau
        },
        issued_by: {
            type: Sequelize.STRING(255),
            //nơi cấp
        },
        contact_person_name_1: {
            type: Sequelize.STRING(50),
        },
        relationship_1: {
            type: Sequelize.INTEGER(4),
        },
        contact_person_phone_number_1: {
            type: Sequelize.STRING(15),
        },
        contact_person_name_2: {
            type: Sequelize.STRING(50),
        },
        relationship_2: {
            type: Sequelize.INTEGER(4),
        },
        contact_person_phone_number_2: {
            type: Sequelize.STRING(15),
        },
        role: {
            type: Sequelize.INTEGER(2),
            defaultValue: 1
        },
        is_online: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        is_authenticated: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        otp: {
            type: Sequelize.STRING(15)
        },
        expires: {
            type: Sequelize.DATE
        },
        google_id: {
            type: Sequelize.STRING(1024),
        },
        facebook_id: {
            type: Sequelize.STRING(1024),
        },
        self_generated_code: {
            type: Sequelize.STRING(10)
        },
        referral_code: {
            type: Sequelize.STRING(10)
        },
        referral_code_usage_count: {
            type: Sequelize.INTEGER(5),
            defaultValue: 0
        },
        apple_id: {
            type: Sequelize.STRING(1024),
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: false
        },
        deleted: {
            type: Sequelize.INTEGER(2),
            defaultValue: false
        },
        created_date: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        created_by: {
            type: Sequelize.STRING(255)
        },
        updated_date: {
            type: Sequelize.DATE,
        },
        updated_date: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    },
        {
            timestamps: false
        });
    return users;
}

