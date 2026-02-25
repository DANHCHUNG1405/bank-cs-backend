"use strict";
const { Sequelize } = require("sequelize");

// complaint model - handles user complaints and disputes
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "complaint",
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      }, // who created complaint
      loan_application_id: Sequelize.INTEGER(11), // related loan
      transaction_id: Sequelize.STRING(100), // related transaction
      complaint_type: {
        type: Sequelize.ENUM(
          "DISBURSEMENT",
          "REPAYMENT",
          "SYSTEM_ERROR",
          "DISPUTE",
          "OTHER"
        ),
        allowNull: false,
      }, // type of complaint
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      evidence_files: Sequelize.TEXT, // json array of evidence file urls
      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "PROCESSING",
          "WAITING_INFO",
          "RESOLVED",
          "REJECTED",
          "ESCALATED"
        ),
        defaultValue: "PENDING",
      }, // complaint status
      priority: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
        defaultValue: "MEDIUM",
      },
      assigned_to: Sequelize.INTEGER(11), // admin handling this
      resolution: Sequelize.TEXT, // resolution details
      resolution_date: Sequelize.DATE,
      is_transaction_locked: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      }, // lock related transaction
      deleted: { type: Sequelize.INTEGER(2), defaultValue: 0 },
      created_date: { type: Sequelize.DATE, defaultValue: DataTypes.NOW },
      created_by: Sequelize.STRING(255),
      updated_date: Sequelize.DATE,
      updated_by: Sequelize.STRING(255),
    },
    { timestamps: false, tableName: "complaint" }
  );
};
