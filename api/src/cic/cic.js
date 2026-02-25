// cic report model - stores credit reports sent to cic
// must keep 5 years per nhnn 2970

"use strict";
const { Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "cic_report",
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },

      // report info
      // BC001: Tên file báo cáo (D1<CTP2P><Date>.zzz.json)
      report_file_name: Sequelize.STRING(100),
      // BC002: Mã công ty (CIC cấp)
      company_code: Sequelize.STRING(20),
      // BC003: Kỳ báo cáo (YYYYMM hoặc YYYYMMDD)
      report_period: Sequelize.STRING(8),
      // BC004: Loại báo cáo
      report_type: {
        type: Sequelize.ENUM(
          "INSTANT_NEW",
          "INSTANT_OLD",
          "DAILY",
          "MONTHLY",
          "CHECK"
        ),
        defaultValue: "CHECK",
      },
      // BC005: Mã giao dịch (unique)
      transaction_code: {
        type: Sequelize.STRING(50),
        unique: true,
      },
      // BC006: Nội dung báo cáo (JSON cho báo cáo định kỳ)
      report_content: Sequelize.TEXT("long"),
      // BC010: Trạng thái xử lý
      processing_status: {
        type: Sequelize.ENUM("PENDING", "PROCESSING", "SUCCESS", "FAILED"),
        defaultValue: "PENDING",
      },

      // linked entities
      loan_application_id: Sequelize.INTEGER(11),
      user_id: Sequelize.INTEGER(11),

      // customer info (ct001-ct006)
      customer_cccd: Sequelize.STRING(12),
      customer_name: Sequelize.STRING(255),
      customer_type: Sequelize.INTEGER(2), // 1=cá nhân, 2=doanh nghiệp
      customer_phone: Sequelize.STRING(20),
      customer_gender: Sequelize.INTEGER(2), // 1=Nam, 2=Nữ
      customer_birth_date: Sequelize.STRING(8), // YYYYMMDD

      // contract info (ct007-ct022)
      contract_code: Sequelize.STRING(50),
      loan_amount: Sequelize.DECIMAL(20, 0),
      outstanding_balance: Sequelize.DECIMAL(20, 0),
      interest_rate: Sequelize.DECIMAL(10, 4),
      loan_term: Sequelize.INTEGER(11),
      disbursement_date: Sequelize.STRING(8), // YYYYMMDD
      maturity_date: Sequelize.STRING(8),
      debt_status: Sequelize.INTEGER(2), // 1-5 theo quy định

      // cic check result
      // CT027: Tổng dư nợ P2P
      total_debt_p2p: Sequelize.DECIMAL(20, 0),
      // CT023-CT025: Dư nợ theo nhóm
      debt_group_1: Sequelize.DECIMAL(20, 0),
      debt_group_2: Sequelize.DECIMAL(20, 0),
      debt_group_3: Sequelize.DECIMAL(20, 0),
      // Có nợ xấu (nhóm 3-5)
      has_bad_debt: Sequelize.INTEGER(2), // 0=không, 1=có
      // CT026: Cảnh báo tên không khớp
      name_mismatch_warning: Sequelize.INTEGER(2),
      // Điểm tín dụng
      credit_score: Sequelize.INTEGER(11),
      // Xếp hạng tín dụng (A/B/C/D/E)
      credit_grade: Sequelize.STRING(1),

      // cic response
      cic_response_code: Sequelize.STRING(20),
      cic_response_message: Sequelize.STRING(500),
      cic_warnings: Sequelize.TEXT, // JSON array
      cic_errors: Sequelize.TEXT, // JSON array
      cic_received_at: Sequelize.STRING(20), // BC010 từ CIC

      // metadata
      retry_count: { type: Sequelize.INTEGER(2), defaultValue: 0 },
      last_retry_at: Sequelize.DATE,
      deleted: { type: Sequelize.INTEGER(2), defaultValue: 0 },
      created_date: { type: Sequelize.DATE, defaultValue: DataTypes.NOW },
      created_by: Sequelize.STRING(255),
      updated_date: Sequelize.DATE,
      updated_by: Sequelize.STRING(255),
    },
    {
      timestamps: false,
      tableName: "cic_report",
      indexes: [
        { fields: ["transaction_code"] },
        { fields: ["loan_application_id"] },
        { fields: ["user_id"] },
        { fields: ["customer_cccd"] },
        { fields: ["report_type"] },
        { fields: ["processing_status"] },
        { fields: ["created_date"] },
      ],
    }
  );
};
