"use strict";
const { Sequelize } = require("sequelize");

// compliance log model - stores CIC compliance check history
// theo QĐ 2970/QĐ-NHNN
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "compliance_log",
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      loan_application_id: Sequelize.INTEGER(11),
      user_id: Sequelize.INTEGER(11),
      check_type: {
        type: Sequelize.ENUM("FULL", "CIC"),
        defaultValue: "CIC",
      },
      check_date: Sequelize.DATE,
      overall_status: {
        type: Sequelize.ENUM("PASSED", "FAILED", "REVIEW_REQUIRED", "ERROR"),
      },
      cic_status: Sequelize.STRING(20),
      cic_transaction_code: Sequelize.STRING(50),
      rejection_reasons: Sequelize.TEXT,
      warnings: Sequelize.TEXT,
      full_result: Sequelize.TEXT("long"),
      deleted: { type: Sequelize.INTEGER(2), defaultValue: 0 },
      created_date: { type: Sequelize.DATE, defaultValue: DataTypes.NOW },
      created_by: Sequelize.STRING(255),
    },
    { timestamps: false, tableName: "compliance_log" }
  );
};
