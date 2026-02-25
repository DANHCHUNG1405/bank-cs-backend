'use strict';
const { Sequelize, DataTypes } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    let authenticate_point = sequelize.define('authenticate_point', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: {
            type: Sequelize.INTEGER(4)
        },
        authenticate_point: { 
            type: Sequelize.INTEGER(5),
            defaultValue: 0
        },
        authenticate_point_count: { 
            type: Sequelize.INTEGER(2),
            defaultValue: 0
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
        updated_date: {
            type: Sequelize.DATE,
        }
    },
        {
            timestamps: false
        });
    return authenticate_point;
}

