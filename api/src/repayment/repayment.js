"use strict";
const { Sequelize } = require("sequelize");

// repayment schedule model - tracks loan repayment periods
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "repayment_schedule",
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
      user_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      period_number: {
        type: Sequelize.INTEGER(4),
        allowNull: false,
      }, // which period
      due_date: {
        type: Sequelize.DATE,
        allowNull: false,
      }, // payment due date
      principal_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      }, // principal for this period
      interest_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      }, // interest for this period
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      }, // total due this period
      paid_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      }, // amount already paid
      remaining_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      }, // remaining to pay
      status: {
        type: Sequelize.ENUM("PENDING", "PAID", "OVERDUE", "PARTIAL"),
        defaultValue: "PENDING",
      }, // payment status
      paid_date: Sequelize.DATE, // actual payment date
      transaction_id: Sequelize.STRING(100), // payment transaction ref
      reminder_sent: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      }, // reminder count
      last_reminder_date: Sequelize.DATE, // last reminder sent
      deleted: { type: Sequelize.INTEGER(2), defaultValue: 0 },
      created_date: { type: Sequelize.DATE, defaultValue: DataTypes.NOW },
      created_by: Sequelize.STRING(255),
      updated_date: Sequelize.DATE,
      updated_by: Sequelize.STRING(255),
    },
    { timestamps: false, tableName: "repayment_schedule" }
  );
};
