const { Sequelize, DataTypes } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let funds = sequelize.define('funds', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: {
            type: Sequelize.INTEGER(4)
            //id của người vay
        },
        investors_id: {
            type: Sequelize.INTEGER(4)
            //id người đầu tư
        },
        loan_application_id: {
            type: Sequelize.INTEGER(4)
            //id yêu cầu vay
        },
        loan_package_id: {
            type: Sequelize.INTEGER(4)
            //id gói vay
        },
        amount_money: {
            type: Sequelize.INTEGER(8),
        },
        interest_rate: {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 3
            // % lãi suất
        },
        profit: {
            type: Sequelize.INTEGER(8),
        },
        type: {
            type: Sequelize.INTEGER(4)
            //1 - đầu tư, 2 - cho vay
        },
        is_package: {
            type: Sequelize.INTEGER(4)
            //0 - không phải vay từ gói, 1 - vay từ gói
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
    return funds;
}