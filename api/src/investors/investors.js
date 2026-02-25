const { Sequelize, DataTypes } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let investors = sequelize.define('investors', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: {
            type: Sequelize.INTEGER(4)
        },
        full_name: {
            type: Sequelize.STRING(50)
        },
        citizen_identification: {
            type: Sequelize.STRING(25),
        },
        name_company: {
            type: Sequelize.STRING(255),
        },
        address_company: {
            type: Sequelize.STRING(255),
        },
        phone: {
            type: Sequelize.STRING(50),
        },
        fund: {
            type: Sequelize.INTEGER(8),
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
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
            type: Sequelize.STRING(255)
        },
        updated_by: {
            type: Sequelize.STRING(255)
        },
        updated_date: {
            type: Sequelize.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        timestamps: false
    });
    return investors;
}