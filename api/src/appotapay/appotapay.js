"use strict";
const { Sequelize } = require("sequelize");

// appotapay transaction model - tracks payment transactions via appotapay
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "appotapay_transaction",
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: { type: Sequelize.INTEGER(11), allowNull: false },
      payment_id: Sequelize.INTEGER(11), // related payment record
      loan_application_id: Sequelize.INTEGER(11), // related loan
      order_id: Sequelize.INTEGER(11), // related order
      transaction_id: Sequelize.STRING(100), // our transaction id
      appotapay_transaction_id: Sequelize.STRING(100), // appotapay's id
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      currency: { type: Sequelize.STRING(10), defaultValue: "VND" },
      payment_method: Sequelize.STRING(20), // atm, qr, bank, etc
      bank_code: Sequelize.STRING(20),
      transaction_type: {
        type: Sequelize.ENUM("DISBURSEMENT", "REPAYMENT", "SETTLEMENT"),
        defaultValue: "REPAYMENT",
      },
      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "PROCESSING",
          "SUCCESS",
          "FAILED",
          "CANCELLED"
        ),
        defaultValue: "PENDING",
      },
      error_code: Sequelize.STRING(50),
      error_message: Sequelize.STRING(500),
      payment_url: Sequelize.TEXT, // payment redirect url
      qr_code: Sequelize.TEXT, // qr code data
      callback_data: Sequelize.TEXT, // raw callback from appotapay
      expired_at: Sequelize.DATE, // payment expiry
      paid_at: Sequelize.DATE, // actual payment time
      deleted: { type: Sequelize.INTEGER(2), defaultValue: 0 },
      created_date: { type: Sequelize.DATE, defaultValue: DataTypes.NOW },
      created_by: Sequelize.STRING(255),
      updated_date: Sequelize.DATE,
      updated_by: Sequelize.STRING(255),
    },
    { timestamps: false, tableName: "appotapay_transaction" }
  );
};
