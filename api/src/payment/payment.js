'use strict';
const { Sequelize, DataTypes } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    let payment = sequelize.define('payment', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: {
            type: Sequelize.INTEGER(4)
        },
        loan_application_id: {
            type: Sequelize.INTEGER(4)
        },
        payment_method: {
            type: Sequelize.INTEGER(2)
        },
        payment_status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        payment_code: {
            type: Sequelize.STRING(255)
        },
        type: {
            type: Sequelize.INTEGER(2)
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: true
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
    return payment;
}

