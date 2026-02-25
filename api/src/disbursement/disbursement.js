"use strict";
const { Sequelize } = require("sequelize");

// disbursement model - tracks loan disbursement flow
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "disbursement",
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      loan_application_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      investor_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      }, // lender
      borrower_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      }, // borrower
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      // investor bank account (source)
      source_bank_code: Sequelize.STRING(20),
      source_account_no: Sequelize.STRING(30),
      source_account_name: Sequelize.STRING(255),
      // borrower bank account (destination)
      dest_bank_code: Sequelize.STRING(20),
      dest_account_no: Sequelize.STRING(30),
      dest_account_name: Sequelize.STRING(255),
      // disbursement status
      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "INVESTOR_TRANSFERRED",
          "PROCESSING",
          "TRANSFERRED_TO_BORROWER",
          "BORROWER_CONFIRMED",
          "COMPLETED",
          "FAILED",
          "DISPUTED"
        ),
        defaultValue: "PENDING",
      },
      // investor to system transaction
      investor_transaction_id: Sequelize.STRING(100),
      investor_transfer_date: Sequelize.DATE,
      investor_transfer_proof: Sequelize.TEXT, // proof image url
      // system to borrower transaction
      borrower_transaction_id: Sequelize.STRING(100),
      borrower_transfer_date: Sequelize.DATE,
      // borrower confirmation
      borrower_confirmed: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      },
      borrower_confirmed_date: Sequelize.DATE,
      borrower_confirmed_amount: Sequelize.DECIMAL(15, 2),
      // auto confirm after 7 days if no complaint
      auto_confirm_date: Sequelize.DATE,
      // error info
      error_code: Sequelize.STRING(50),
      error_message: Sequelize.STRING(500),
      retry_count: {
        type: Sequelize.INTEGER(4),
        defaultValue: 0,
      },
      deleted: { type: Sequelize.INTEGER(2), defaultValue: 0 },
      created_date: { type: Sequelize.DATE, defaultValue: DataTypes.NOW },
      created_by: Sequelize.STRING(255),
      updated_date: Sequelize.DATE,
      updated_by: Sequelize.STRING(255),
    },
    { timestamps: false, tableName: "disbursement" }
  );
};
