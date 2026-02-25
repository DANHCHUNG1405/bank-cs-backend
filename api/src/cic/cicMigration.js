/**
 * CIC Migration
 * Tự động thêm các cột CIC vào bảng loan_application
 */

const runCicMigration = async (sequelize) => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    // Kiểm tra và thêm các cột CIC vào loan_application
    const tableDescription = await queryInterface.describeTable(
      "loan_application"
    );

    const columnsToAdd = [
      {
        name: "compliance_checked",
        type: "TINYINT(1)",
        defaultValue: "0",
      },
      {
        name: "compliance_check_date",
        type: "DATETIME",
        defaultValue: null,
      },
      {
        name: "compliance_status",
        type: "VARCHAR(50)",
        defaultValue: null,
      },
      {
        name: "compliance_result",
        type: "TEXT",
        defaultValue: null,
      },
      {
        name: "cic_checked",
        type: "TINYINT(1)",
        defaultValue: "0",
      },
      {
        name: "cic_check_date",
        type: "DATETIME",
        defaultValue: null,
      },
      {
        name: "cic_transaction_code",
        type: "VARCHAR(100)",
        defaultValue: null,
      },
      {
        name: "cic_total_debt",
        type: "DECIMAL(20,2)",
        defaultValue: "0",
      },
      {
        name: "cic_has_bad_debt",
        type: "TINYINT(1)",
        defaultValue: "0",
      },
      {
        name: "cic_credit_score",
        type: "INT",
        defaultValue: null,
      },
      {
        name: "cic_credit_grade",
        type: "VARCHAR(10)",
        defaultValue: null,
      },
    ];

    for (const column of columnsToAdd) {
      if (!tableDescription[column.name]) {
        const defaultClause =
          column.defaultValue !== null
            ? `DEFAULT ${
                typeof column.defaultValue === "string" &&
                column.defaultValue !== "0"
                  ? `'${column.defaultValue}'`
                  : column.defaultValue
              }`
            : "DEFAULT NULL";

        await sequelize.query(
          `ALTER TABLE loan_application ADD COLUMN ${column.name} ${column.type} ${defaultClause}`
        );
        console.log(`Added column ${column.name} to loan_application`);
      }
    }

    // Tạo bảng cic_report nếu chưa tồn tại
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cic_report (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_file_name VARCHAR(255),
        company_code VARCHAR(50),
        report_period VARCHAR(20),
        report_type VARCHAR(50),
        transaction_code VARCHAR(100),
        report_content LONGTEXT,
        processing_status VARCHAR(50) DEFAULT 'PENDING',
        loan_application_id INT,
        user_id INT,
        customer_cccd VARCHAR(20),
        customer_name VARCHAR(255),
        customer_type TINYINT DEFAULT 1,
        contract_code VARCHAR(100),
        loan_amount DECIMAL(20,2),
        outstanding_balance DECIMAL(20,2),
        total_debt_p2p DECIMAL(20,2),
        has_bad_debt TINYINT DEFAULT 0,
        credit_score INT,
        credit_grade VARCHAR(10),
        cic_response_code VARCHAR(50),
        cic_response_message TEXT,
        cic_warnings TEXT,
        cic_errors TEXT,
        retry_count INT DEFAULT 0,
        last_retry_at DATETIME,
        deleted TINYINT DEFAULT 0,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(100),
        INDEX idx_transaction_code (transaction_code),
        INDEX idx_loan_application_id (loan_application_id),
        INDEX idx_report_type (report_type),
        INDEX idx_processing_status (processing_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("cic_report table ready");

    // Tạo bảng compliance_log nếu chưa tồn tại
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS compliance_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_application_id INT,
        user_id INT,
        check_type VARCHAR(50),
        check_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        overall_status VARCHAR(50),
        cic_status VARCHAR(50),
        cic_transaction_code VARCHAR(100),
        rejection_reasons TEXT,
        warnings TEXT,
        full_result LONGTEXT,
        deleted TINYINT DEFAULT 0,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(100),
        INDEX idx_loan_application_id (loan_application_id),
        INDEX idx_user_id (user_id),
        INDEX idx_check_type (check_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("compliance_log table ready");

    console.log("CIC migration completed successfully");
  } catch (error) {
    console.error("CIC migration error:", error.message);
    // Không throw error để app vẫn chạy được
  }
};

module.exports = { runCicMigration };
