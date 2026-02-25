"use strict";
const { Sequelize, DataTypes } = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    let product = sequelize.define(
        "product",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(4),
            },
            user_id: {
                type: Sequelize.INTEGER(4),
            },
            category_id: { 
                type: Sequelize.INTEGER(4)
            },
            name: { 
                type: Sequelize.STRING(255)
            },
            description:{ 
                type: Sequelize.STRING(1024)
            },
            price_product: {
                type: Sequelize.BIGINT(20)
                //Giá sản phẩm bán
            },
            image_url: {
                type: Sequelize.TEXT('long')
            },
            type: {
                type: Sequelize.INTEGER(2)
                //type: 1 - Bán xe
                //type: 2 - Thuê xe
            },
            total_like: {
                type: Sequelize.INTEGER(4),
                defaultValue: 0
            },
            is_available: {
                type: Sequelize.INTEGER(2),
                defaultValue: true
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
    return product;
};
