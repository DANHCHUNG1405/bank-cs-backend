"use strict";
const { Sequelize, DataTypes } = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    let addresses = sequelize.define(
        "addresses",
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
            address_detail_1: {
                type: Sequelize.TEXT('long'),
                get: function () {
                    if (typeof this.getDataValue("address_detail_1") !== 'undefined')
                      return JSON.parse(this.getDataValue("address_detail_1"));
                },
                set: function (value) {
                    return this.setDataValue("address_detail_1", JSON.stringify(value));
                }
                //địa chỉ thường trú
            },
            address_detail_2: {
                type: Sequelize.TEXT('long'),
                get: function () {
                    if (typeof this.getDataValue("address_detail_2") !== 'undefined')
                      return JSON.parse(this.getDataValue("address_detail_2"));
                },
                set: function (value) {
                    return this.setDataValue("address_detail_2", JSON.stringify(value));
                }
                //địa chỉ hiện tại
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
    return addresses;
};
