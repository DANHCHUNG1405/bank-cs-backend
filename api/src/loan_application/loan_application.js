const { Sequelize, DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  let loan_application = sequelize.define(
    "loan_application",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(4),
      },
      user_id: {
        type: Sequelize.INTEGER(4),
      },
      borrower_information_id: {
        type: Sequelize.INTEGER(4),
      },
      loan_information_id: {
        type: Sequelize.INTEGER(4),
      },
      application_date: {
        type: Sequelize.DATE,
      },
      end_date: {
        type: Sequelize.DATE,
      },
      code_transaction: {
        type: Sequelize.STRING(25),
      },
      is_pay: {
        type: Sequelize.INTEGER(3),
        defaultValue: 0,
      },
      status: {
        type: Sequelize.INTEGER(2),
        defaultValue: 1,
      },
      // ============ CIC COMPLIANCE FIELDS ============
      // Kiểm tra CIC trước khi cho vay (Bước 6-7)
      cic_checked: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      },
      cic_check_date: {
        type: Sequelize.DATE,
      },
      cic_transaction_code: {
        type: Sequelize.STRING(50),
      },
      cic_total_debt: {
        type: Sequelize.DECIMAL(20, 0),
        defaultValue: 0,
      },
      cic_has_bad_debt: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      },
      // Báo cáo CIC sau giải ngân
      cic_reported: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      },
      cic_report_date: {
        type: Sequelize.DATE,
      },
      cic_report_transaction_code: {
        type: Sequelize.STRING(50),
      },
      // Compliance check tổng hợp (Bước 6-9)
      compliance_checked: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      },
      compliance_check_date: {
        type: Sequelize.DATE,
      },
      compliance_status: {
        type: Sequelize.STRING(20), // PASSED, FAILED, REVIEW_REQUIRED
      },
      compliance_result: {
        type: Sequelize.TEXT("long"), // JSON full result
      },
      rejection_reason: {
        type: Sequelize.TEXT,
      },
      // Giải ngân
      disbursement_date: {
        type: Sequelize.DATE,
      },
      // Tình trạng nợ (1-5 theo CIC)
      debt_status: {
        type: Sequelize.INTEGER(2),
        defaultValue: 1,
      },
      outstanding_principal: {
        type: Sequelize.DECIMAL(20, 0),
      },
      outstanding_interest: {
        type: Sequelize.DECIMAL(20, 0),
        defaultValue: 0,
      },
      overdue_interest: {
        type: Sequelize.DECIMAL(20, 0),
        defaultValue: 0,
      },
      // ============ END CIC FIELDS ============
      deleted: {
        type: Sequelize.INTEGER(2),
        defaultValue: 0,
      },
      created_date: {
        type: Sequelize.DATE,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: Sequelize.STRING(255),
      },
      updated_by: {
        type: Sequelize.STRING(255),
      },
      updated_date: {
        type: Sequelize.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
    }
  );
  return loan_application;
};
