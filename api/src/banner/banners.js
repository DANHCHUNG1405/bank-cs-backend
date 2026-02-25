"use strict";
const { Sequelize, DataTypes } = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    let banner = sequelize.define(
        "banner",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(4),
            },
            user_id: {
                type: Sequelize.INTEGER(4)
            },
            image_url: {
                type: Sequelize.TEXT('long') 
            },
            status: {
                type: Sequelize.INTEGER(2),
                defaultValue: true,
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
    return banner;
};
