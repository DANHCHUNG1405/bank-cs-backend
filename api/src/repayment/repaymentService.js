// repayment service - handles repayment schedule and payment tracking

const models = require("../../../models");
const { Op } = require("sequelize");
const logger = require("../../../winston");
const cicService = require("../cic/cicService");

// create repayment schedule when loan is disbursed
exports.createRepaymentSchedule = async (loanApplicationId) => {
  try {
    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
      include: [{ model: models.loan_information }],
    });

    if (!loan || !loan.loan_information) {
      return { success: false, message: "Không tìm thấy thông tin khoản vay" };
    }

    const loanInfo = loan.loan_information;
    const schedules = [];
    const startDate = new Date(loan.application_date || new Date());

    for (let i = 1; i <= loanInfo.time_loan; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      // Tính tiền gốc và lãi mỗi kỳ
      const principalPerPeriod = Math.round(
        loanInfo.loan_amount / loanInfo.time_loan
      );
      const interestPerPeriod = Math.round(
        loanInfo.total_profit / loanInfo.time_loan
      );
      const totalPerPeriod = principalPerPeriod + interestPerPeriod;

      schedules.push({
        loan_application_id: loanApplicationId,
        user_id: loan.user_id,
        period_number: i,
        due_date: dueDate,
        principal_amount: principalPerPeriod,
        interest_amount: interestPerPeriod,
        total_amount: totalPerPeriod,
        remaining_amount: totalPerPeriod,
        status: "PENDING",
        created_by: loan.user_id.toString(),
      });
    }

    await models.repayment_schedule.bulkCreate(schedules);
    return { success: true, data: schedules };
  } catch (err) {
    logger.error("createRepaymentSchedule error:", err);
    return { success: false, error: err.message };
  }
};

// get repayment schedule by loan application
exports.getByLoanApplication = async (loanApplicationId) => {
  return models.repayment_schedule.findAll({
    where: { loan_application_id: loanApplicationId, deleted: 0 },
    order: [["period_number", "ASC"]],
  });
};

// get repayment schedule by user
exports.getByUser = async (userId, options = {}) => {
  const where = { user_id: userId, deleted: 0 };
  if (options.status) where.status = options.status;

  return models.repayment_schedule.findAll({
    where,
    include: [
      {
        model: models.loan_application,
        attributes: ["id", "code_transaction", "status"],
      },
    ],
    order: [["due_date", "ASC"]],
    limit: options.limit || 50,
    offset: options.offset || 0,
  });
};

// Lấy các kỳ sắp đến hạn (trong vòng X ngày)
exports.getUpcomingDue = async (daysAhead = 7) => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return models.repayment_schedule.findAll({
    where: {
      due_date: { [Op.between]: [now, futureDate] },
      status: "PENDING",
      deleted: 0,
    },
    include: [
      {
        model: models.loan_application,
        attributes: ["id", "code_transaction", "user_id"],
        include: [
          {
            model: models.users,
            attributes: ["id", "full_name", "phone", "email"],
          },
        ],
      },
    ],
    order: [["due_date", "ASC"]],
  });
};

// Lấy các kỳ đã quá hạn
exports.getOverdue = async () => {
  return models.repayment_schedule.findAll({
    where: {
      due_date: { [Op.lt]: new Date() },
      status: { [Op.in]: ["PENDING", "PARTIAL"] },
      deleted: 0,
    },
    include: [
      {
        model: models.loan_application,
        attributes: ["id", "code_transaction", "user_id"],
        include: [
          {
            model: models.users,
            attributes: ["id", "full_name", "phone", "email"],
          },
        ],
      },
    ],
    order: [["due_date", "ASC"]],
  });
};

// Cập nhật trạng thái sau khi thanh toán
exports.updatePayment = async (scheduleId, data) => {
  try {
    const schedule = await models.repayment_schedule.findOne({
      where: { id: scheduleId, deleted: 0 },
    });

    if (!schedule) {
      return { success: false, message: "Không tìm thấy lịch trả nợ" };
    }

    const paidAmount =
      parseFloat(schedule.paid_amount) + parseFloat(data.amount);
    const remainingAmount = parseFloat(schedule.total_amount) - paidAmount;

    let status = "PARTIAL";
    if (remainingAmount <= 0) {
      status = "PAID";
    }

    await models.repayment_schedule.update(
      {
        paid_amount: paidAmount,
        remaining_amount: Math.max(0, remainingAmount),
        status,
        paid_date: status === "PAID" ? new Date() : null,
        transaction_id: data.transactionId,
        updated_date: new Date(),
      },
      { where: { id: scheduleId } }
    );

    return {
      success: true,
      status,
      remainingAmount: Math.max(0, remainingAmount),
    };
  } catch (err) {
    logger.error("updatePayment error:", err);
    return { success: false, error: err.message };
  }
};

// update reminder sent count
exports.updateReminderSent = async (scheduleId) => {
  return models.repayment_schedule.update(
    {
      reminder_sent: models.sequelize.literal("reminder_sent + 1"),
      last_reminder_date: new Date(),
      updated_date: new Date(),
    },
    { where: { id: scheduleId } }
  );
};

// mark schedule as overdue
exports.markOverdue = async (scheduleId) => {
  return models.repayment_schedule.update(
    { status: "OVERDUE", updated_date: new Date() },
    { where: { id: scheduleId, status: "PENDING" } }
  );
};

// calculate total remaining debt for a loan
exports.getRemainingDebt = async (loanApplicationId) => {
  const result = await models.repayment_schedule.findAll({
    where: {
      loan_application_id: loanApplicationId,
      status: { [Op.in]: ["PENDING", "PARTIAL", "OVERDUE"] },
      deleted: 0,
    },
    attributes: [
      [
        models.sequelize.fn("SUM", models.sequelize.col("remaining_amount")),
        "total_remaining",
      ],
    ],
    raw: true,
  });

  return parseFloat(result[0]?.total_remaining || 0);
};

// get next due schedule for a loan
exports.getNextDue = async (loanApplicationId) => {
  return models.repayment_schedule.findOne({
    where: {
      loan_application_id: loanApplicationId,
      status: { [Op.in]: ["PENDING", "PARTIAL", "OVERDUE"] },
      deleted: 0,
    },
    order: [["period_number", "ASC"]],
  });
};

// cic integration

// report cic when loan changes (payment, settlement) per nhnn 2970
exports.reportCICChange = async (loanApplicationId, changeType) => {
  try {
    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
      include: [
        {
          model: models.users,
          attributes: [
            "id",
            "full_name",
            "phone",
            "birthday",
            "gender",
            "cccd",
          ],
        },
      ],
    });

    if (!loan) {
      logger.warn(`CIC report: Loan ${loanApplicationId} not found`);
      return { success: false, message: "Không tìm thấy khoản vay" };
    }

    if (!loan.cic_report_transaction_code) {
      logger.warn(
        `CIC report: Loan ${loanApplicationId} has no original CIC transaction`
      );
      return { success: false, message: "Khoản vay chưa được báo cáo lần đầu" };
    }

    // Tính số dư nợ còn lại
    const remainingDebt = await this.getRemainingDebt(loanApplicationId);

    const result = await cicService.reportOldLoan({
      loanApplicationId: loan.id,
      userId: loan.user_id,
      cccd: loan.user?.cccd,
      customerName: loan.user?.full_name,
      birthDate: loan.user?.birthday,
      phone: loan.user?.phone,
      gender: loan.user?.gender,
      outstandingBalance: remainingDebt,
      originalTransactionCode: loan.cic_report_transaction_code,
      changeType, // THANHTOAN, GIAHAN, TATTOAN
    });

    if (result.success) {
      logger.info(
        `CIC change report SUCCESS for loan ${loanApplicationId}, type: ${changeType}`
      );
    } else {
      logger.error(
        `CIC change report FAILED for loan ${loanApplicationId}:`,
        result.error
      );
    }

    return result;
  } catch (error) {
    logger.error(
      `CIC change report error for loan ${loanApplicationId}:`,
      error
    );
    return { success: false, error: error.message };
  }
};

// process payment and report to cic
exports.processPaymentWithCIC = async (scheduleId, data) => {
  const result = await this.updatePayment(scheduleId, data);

  if (result.success && result.status === "PAID") {
    // Lấy thông tin schedule để báo cáo CIC
    const schedule = await models.repayment_schedule.findOne({
      where: { id: scheduleId },
    });

    if (schedule) {
      // Kiểm tra xem đã tất toán chưa
      const remainingDebt = await this.getRemainingDebt(
        schedule.loan_application_id
      );

      if (remainingDebt <= 0) {
        // Tất toán - báo cáo TATTOAN
        await this.reportCICChange(schedule.loan_application_id, "TATTOAN");

        // Cập nhật trạng thái khoản vay
        await models.loan_application.update(
          { status: 5, updated_date: new Date() }, // 5 = Tất toán
          { where: { id: schedule.loan_application_id } }
        );
      } else {
        // Thanh toán kỳ - báo cáo THANHTOAN
        await this.reportCICChange(schedule.loan_application_id, "THANHTOAN");
      }
    }
  }

  return result;
};
