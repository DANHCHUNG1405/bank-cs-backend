"use strict";
const { Sequelize, DataTypes } = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    let product_detail = sequelize.define(
        "product_detail",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(4),
            },
            product_id: { 
                type: Sequelize.INTEGER(4)
            },
            year_manufacture: {
                type: Sequelize.INTEGER(4)
            },
            odo: {
                type: Sequelize.INTEGER(10)
            },
            type_car: {
                type: Sequelize.INTEGER(2)
                //type_car: 1 - Xe tự động
                //type_car: 2 - Xe số sàn
            },
            location_id: {
                type: Sequelize.INTEGER(4)
            },
            status: {
                type: Sequelize.INTEGER(2),
                defaultValue: 1,
            },
            deleted: {
                type: Sequelize.INTEGER(2),
                defaultValue: false,
            },
            created_date: {
                type: Sequelize.DATE,
                defaultValue: DataTypes.NOW,
            },
            created_by: {
                type: Sequelize.STRING(255),
            },
            updated_date: {
                type: Sequelize.DATE,
            },
            updated_by: {
                type: Sequelize.STRING(255),
            },
        },
        {
            timestamps: false,
        }
    );
    return product_detail;
};
