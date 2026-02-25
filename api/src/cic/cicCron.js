// cic cron jobs - auto send periodic reports per nhnn 2970
// d1: daily at 23:00 (before 23:59)
// d2: monthly last day at 23:30
// retry: every 4 hours for failed reports

const cron = require("node-cron");
const cicService = require("./cicService");
const models = require("../../../models");
const logger = require("../../../winston");

// get contracts for d1 daily report - disbursements and changes today
const getDailyContracts = async (date) => {
  const { Op } = require("sequelize");
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const loans = await models.loan_application.findAll({
      where: {
        deleted: 0,
        [Op.or]: [
          // Giải ngân trong ngày
          { disbursement_date: { [Op.between]: [startOfDay, endOfDay] } },
          // Có biến động trong ngày (trả nợ, tất toán...)
          {
            updated_date: { [Op.between]: [startOfDay, endOfDay] },
            status: { [Op.in]: [3, 4, 5] },
          },
        ],
      },
      include: [
        {
          model: models.users,
          attributes: [
            "id",
            "full_name",
            "cccd",
            "birthday",
            "gender",
            "phone",
          ],
        },
      ],
    });

    return loans.map((loan) => ({
      transactionCode:
        loan.cic_report_transaction_code ||
        cicService.generateTransactionCode("C"),
      cccd: loan.user?.cccd,
      customerName: loan.user?.full_name,
      birthDate: loan.user?.birthday,
      phone: loan.user?.phone,
      gender: loan.user?.gender,
      loanAmount: loan.loan_amount,
      outstandingBalance: loan.outstanding_principal || loan.loan_amount,
    }));
  } catch (error) {
    logger.error("getDailyContracts error:", error.message);
    return [];
  }
};

// get contracts for d2 monthly report - all with outstanding balance
const getMonthlyContracts = async () => {
  const { Op } = require("sequelize");

  try {
    const loans = await models.loan_application.findAll({
      where: {
        deleted: 0,
        status: { [Op.in]: [3, 4] }, // Đang trả nợ
        outstanding_principal: { [Op.gt]: 0 },
      },
      include: [
        {
          model: models.users,
          attributes: [
            "id",
            "full_name",
            "cccd",
            "birthday",
            "gender",
            "phone",
          ],
        },
      ],
    });

    return loans.map((loan) => ({
      transactionCode:
        loan.cic_report_transaction_code ||
        cicService.generateTransactionCode("C"),
      cccd: loan.user?.cccd,
      customerName: loan.user?.full_name,
      birthDate: loan.user?.birthday,
      phone: loan.user?.phone,
      gender: loan.user?.gender,
      loanAmount: loan.loan_amount,
      outstandingBalance: loan.outstanding_principal,
    }));
  } catch (error) {
    logger.error("getMonthlyContracts error:", error.message);
    return [];
  }
};

// d1 daily report job - runs at 23:00
const dailyReportJob = async () => {
  logger.info("=== CIC Daily Report (D1) Started ===");

  try {
    const today = new Date();
    const contracts = await getDailyContracts(today);

    if (contracts.length === 0) {
      logger.info("D1: Không có hợp đồng cần báo cáo hôm nay");
      return;
    }

    logger.info(`D1: Tìm thấy ${contracts.length} hợp đồng cần báo cáo`);

    const result = await cicService.reportPeriodic(
      cicService.REPORT_TYPES.DAILY,
      today,
      contracts
    );

    if (result.success) {
      logger.info(`D1: Báo cáo thành công - ${result.fileName}`);
      logger.info(
        `D1: Thành công: ${result.successCount}, Thất bại: ${result.failedCount}`
      );
    } else {
      logger.error(`D1: Báo cáo thất bại - ${result.error?.message}`);
    }
  } catch (error) {
    logger.error("D1 Report Job Error:", error.message);
  }

  logger.info("=== CIC Daily Report (D1) Completed ===");
};

// d2 monthly report job - runs last day of month at 23:30
const monthlyReportJob = async () => {
  logger.info("=== CIC Monthly Report (D2) Started ===");

  try {
    const today = new Date();
    const contracts = await getMonthlyContracts();

    if (contracts.length === 0) {
      logger.info("D2: Không có hợp đồng còn dư nợ");
      return;
    }

    logger.info(`D2: Tìm thấy ${contracts.length} hợp đồng còn dư nợ`);

    const result = await cicService.reportPeriodic(
      cicService.REPORT_TYPES.MONTHLY,
      today,
      contracts
    );

    if (result.success) {
      logger.info(`D2: Báo cáo thành công - ${result.fileName}`);
      logger.info(
        `D2: Thành công: ${result.successCount}, Thất bại: ${result.failedCount}`
      );
    } else {
      logger.error(`D2: Báo cáo thất bại - ${result.error?.message}`);
    }
  } catch (error) {
    logger.error("D2 Report Job Error:", error.message);
  }

  logger.info("=== CIC Monthly Report (D2) Completed ===");
};

// retry failed reports job - runs every 4 hours, max 3 retries
const retryFailedReportsJob = async () => {
  logger.info("=== CIC Retry Failed Reports Started ===");

  try {
    const failedReports = await cicService.getFailedReportsForRetry(3);

    if (!failedReports.success || failedReports.data.length === 0) {
      logger.info("Retry: Không có báo cáo thất bại cần retry");
      return;
    }

    logger.info(
      `Retry: Tìm thấy ${failedReports.data.length} báo cáo cần retry`
    );

    for (const report of failedReports.data) {
      try {
        await cicService.updateRetryCount(report.id);

        if (report.report_type === cicService.REPORT_TYPES.INSTANT_NEW) {
          const loan = await models.loan_application.findOne({
            where: { id: report.loan_application_id },
            include: [{ model: models.users }],
          });

          if (loan) {
            const result = await cicService.reportNewLoan({
              loanApplicationId: loan.id,
              userId: loan.user_id,
              cccd: loan.user?.cccd,
              customerName: loan.user?.full_name,
              birthDate: loan.user?.birthday,
              phone: loan.user?.phone,
              gender: loan.user?.gender,
              loanAmount: loan.loan_amount,
            });

            if (result.success) {
              logger.info(`Retry: Báo cáo ${report.id} thành công`);
            } else {
              logger.warn(`Retry: Báo cáo ${report.id} vẫn thất bại`);
            }
          }
        }

        // Delay giữa các retry để tránh rate limit
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Retry: Lỗi xử lý báo cáo ${report.id}:`, error.message);
      }
    }
  } catch (error) {
    logger.error("Retry Job Error:", error.message);
  }

  logger.info("=== CIC Retry Failed Reports Completed ===");
};

// check if today is last day of month
const isLastDayOfMonth = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getDate() === 1;
};

// start all cron jobs
const startCronJobs = () => {
  // Kiểm tra CIC đã được cấu hình chưa
  if (!process.env.CIC_BASE_URL || !process.env.CIC_USERNAME) {
    logger.warn("CIC chưa được cấu hình, cron jobs sẽ không chạy");
    return;
  }

  // D1: Báo cáo hàng ngày lúc 23:00
  cron.schedule("0 23 * * *", dailyReportJob, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });
  logger.info("CIC D1 Cron: Đã lên lịch chạy lúc 23:00 hàng ngày");

  // D2: Báo cáo hàng tháng lúc 23:30 ngày cuối tháng
  cron.schedule(
    "30 23 28-31 * *",
    async () => {
      if (isLastDayOfMonth()) {
        await monthlyReportJob();
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh",
    }
  );
  logger.info("CIC D2 Cron: Đã lên lịch chạy lúc 23:30 ngày cuối tháng");

  // Retry: Mỗi 4 giờ
  cron.schedule("0 */4 * * *", retryFailedReportsJob, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });
  logger.info("CIC Retry Cron: Đã lên lịch chạy mỗi 4 giờ");

  logger.info("=== CIC Cron Jobs Started ===");
};

module.exports = {
  startCronJobs,
  dailyReportJob,
  monthlyReportJob,
  retryFailedReportsJob,
};
