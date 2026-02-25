'use strict';
const { Sequelize, DataTypes } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    let notifications = sequelize.define('notifications', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4)
        },
        name: {
            type: Sequelize.STRING(255)
        },
        user_id: {
            type: Sequelize.INTEGER(4),
        },
        type_id: { 
            type: Sequelize.INTEGER(4)
        },
        content: {
            type: Sequelize.STRING(1024)
        },
        type: {
            type: Sequelize.INTEGER(4)
            //type: 1- thông báo tin nhắn chat 1-1
            //type: 2- thông báo tạo yêu cầu đơn vay
        },
        otp: {
            type: Sequelize.STRING(15)
        },
        image_url: {
            type: Sequelize.STRING(1024)
        },
        is_read: { 
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 1
        },
        deleted: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        created_date: {
            type: Sequelize.DATE,
            defaultValue: DataTypes.NOW,
        },
        created_by: {
            type: Sequelize.STRING
        },
        updated_date: {
            type: Sequelize.DATE
        },
        updated_by: {
            type: Sequelize.STRING(255)
        },
    },
        {
            timestamps: false
        });
    return notifications;
}