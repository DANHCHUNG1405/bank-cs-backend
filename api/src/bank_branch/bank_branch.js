const {Sequelize, DataTypes} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let bank_branch = sequelize.define('bank_branch', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: { 
            type: Sequelize.INTEGER(4)
        },
        address_id: {
            type: Sequelize.INTEGER(4),
            allowNull: false
        },
        name: { 
            type: Sequelize.STRING(50)
        },
        bank_account_number: {
            type: Sequelize.STRING(25)
        },
        account_name: {
            type: Sequelize.STRING(255)
        },
        image_QR: {
            type: Sequelize.TEXT('long')
        },
        lat: {
            type: Sequelize.DOUBLE(16, 4)
        },
        lng: {
            type: Sequelize.DOUBLE(16, 4)
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
    },{
        timestamps: false
    });
    return bank_branch;
}