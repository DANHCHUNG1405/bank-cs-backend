"use strict";
const { Sequelize, DataTypes } = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    let category = sequelize.define(
        "category",
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
            image_url: {
                type: Sequelize.TEXT('long')
            },
            name_brand_car: {
                type: Sequelize.STRING(20)
            },
            topic_name: {
                type: Sequelize.STRING(30)
            },
            type: {
                type: Sequelize.INTEGER(2)
                //type: 1 - hãng xe 
                //type: 2 - câu hỏi theo chủ đề 
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
    return category;
};
