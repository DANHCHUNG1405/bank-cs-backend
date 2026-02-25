const {Sequelize, DataTypes} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let bank = sequelize.define('bank', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: { 
            type: Sequelize.INTEGER(4)
        },
        name_bank: {
            type: Sequelize.STRING(255)
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 1
        },
        deleted: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        }
    },{
        timestamps: false
    });
    return bank;
}