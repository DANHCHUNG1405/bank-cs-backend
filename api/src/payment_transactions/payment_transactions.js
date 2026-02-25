const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const payment_transactions = sequelize.define(
    "payment_transactions",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      loan_application_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      request_id: {
        type: Sequelize.STRING(100),
        comment: "request code to Appotapay",
      },
      transaction_id: {
        type: Sequelize.STRING(100),
        comment: "transaction code from Appotapay",
      },
      transaction_type: {
        type: Sequelize.STRING(50),
        comment: "VIRTUAL_ACCOUNT, DISBURSEMENT, REPAYMENT",
      },
      virtual_account_number: {
        type: Sequelize.STRING(50),
        comment: "virtual account number",
      },
      bank_code: {
        type: Sequelize.STRING(20),
      },
      account_number: {
        type: Sequelize.STRING(30),
      },
      account_name: {
        type: Sequelize.STRING(100),
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      received_amount: {
        type: Sequelize.DECIMAL(15, 2),
        comment: "received amount",
      },
      fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: "PENDING",
        comment: "PENDING, SUCCESS, FAILED, EXPIRED",
      },
      expired_at: {
        type: Sequelize.DATE,
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      response_data: {
        type: Sequelize.TEXT("long"),
        comment: "JSON response from Appotapay",
      },
      callback_data: {
        type: Sequelize.TEXT("long"),
        comment: "JSON callback from Appotapay",
      },
      created_date: {
        type: Sequelize.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_date: {
        type: Sequelize.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      tableName: "payment_transactions",
    }
  );

  return payment_transactions;
};
