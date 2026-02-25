'use strict';
const { Sequelize, DataTypes } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    let orders = sequelize.define('orders', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4)
        },
        user_id: {
            type: Sequelize.INTEGER(4)
        },
        loan_application_id: {
            type: Sequelize.INTEGER(4)
        },
        product_id : {
            type: Sequelize.INTEGER(4)
        },
        code: {
            type: Sequelize.STRING(255)
        },
        type: {
            type: Sequelize.INTEGER(2)
            //type: 1 - mua trả góp
            //type: 2 - mua trả thẳng
        },
        is_order: { 
            type: Sequelize.INTEGER(2),
            defaultValue: true
        },
        status: {
            type: Sequelize.INTEGER(3),
            defaultValue: false,
        },
        deleted: {
            type: Sequelize.INTEGER(2),
            defaultValue: false
        },
        bought_from: {
            type: Sequelize.INTEGER(4)
        },
        created_date: {
            type: Sequelize.DATE,
            defaultValue: DataTypes.NOW
        },
        created_by: {
            type: Sequelize.STRING(255)
        },
        updated_date: {
            type: Sequelize.DATE,
        },
        updated_by: {
            type: Sequelize.STRING(255)
        },
    },
        {
            timestamps: false
        });
    return orders;
} 