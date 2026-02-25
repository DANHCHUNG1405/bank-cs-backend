const { Sequelize, DataTypes } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let loan_information = sequelize.define('loan_information', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: {
            type: Sequelize.INTEGER(4)
        },
        interest_rate: {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 0.03
        },
        time_loan: {
            type: Sequelize.INTEGER(2),
            allowNull: false
        },
        loan_amount: {
            type: Sequelize.INTEGER(8),
            allowNull: false
        },
        payment_per_period: {
            type: Sequelize.INTEGER(7),
            defaultValue: 0
        },
        total_payment: {
            type: Sequelize.INTEGER(8),
            defaultValue: 0
        },
        total_profit: {
            type: Sequelize.INTEGER(6),
            defaultValue: 0
        },
        is_check: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        type: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
            // 1 - vay onl, 2 - vay nhanh
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 1
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
    return loan_information;
}