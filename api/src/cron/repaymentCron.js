// repayment cron jobs - handles payment reminders and overdue processing

const cron = require("node-cron");
const models = require("../../../models");
const { Op } = require("sequelize");
const repaymentService = require("../repayment/repaymentService");
const disbursementService = require("../disbursement/disbursementService");
const notiService = require("../notifications/notiService");
const { notiFcm } = require("../../helper/fcm");
const logger = require("../../../winston");
const { host } = require("../../../config/config.json");

// send payment reminder notification
const sendReminderNotification = async (schedule, daysUntilDue) => {
  try {
    const loan = await models.loan_application.findOne({
      where: { id: schedule.loan_application_id },
      include: [
        {
          model: models.users,
          attributes: ["id", "full_name", "phone", "email"],
        },
      ],
    });

    if (!loan) return;

    let message = "";
    if (daysUntilDue > 0) {
      message = `Khoản vay ${loan.code_transaction} sẽ đến hạn thanh toán kỳ ${
        schedule.period_number
      } sau ${daysUntilDue} ngày. Số tiền: ${schedule.remaining_amount.toLocaleString()}đ`;
    } else if (daysUntilDue === 0) {
      message = `Hôm nay là hạn thanh toán kỳ ${
        schedule.period_number
      } của khoản vay ${
        loan.code_transaction
      }. Số tiền: ${schedule.remaining_amount.toLocaleString()}đ`;
    } else {
      message = `Khoản vay ${loan.code_transaction} đã quá hạn thanh toán kỳ ${
        schedule.period_number
      } ${Math.abs(
        daysUntilDue
      )} ngày. Số tiền: ${schedule.remaining_amount.toLocaleString()}đ. Vui lòng thanh toán ngay!`;
    }

    const payload = {
      title:
        daysUntilDue < 0
          ? "⚠️ Cảnh báo quá hạn thanh toán"
          : "🔔 Nhắc nhở thanh toán",
      body: message,
      name:
        daysUntilDue < 0
          ? "Cảnh báo quá hạn thanh toán"
          : "Nhắc nhở thanh toán",
      content: message,
      type_id: schedule.loan_application_id.toString(),
      type: "6",
      deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${schedule.loan_application_id}`,
      user_id: schedule.user_id.toString(),
    };

    const noti = await notiService.create(payload);
    await notiFcm(schedule.user_id, payload, noti.id);
    await repaymentService.updateReminderSent(schedule.id);

    logger.info(
      `Sent reminder to user ${schedule.user_id} for schedule ${schedule.id}`
    );
  } catch (err) {
    logger.error("sendReminderNotification error:", err);
  }
};

// job 1: send reminders 7, 3, 1 days before due
const reminderJob = async () => {
  logger.info("Running reminder job...");

  try {
    const now = new Date();

    // get schedules due within 7 days
    const upcomingSchedules = await repaymentService.getUpcomingDue(7);

    for (const schedule of upcomingSchedules) {
      const dueDate = new Date(schedule.due_date);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // send reminder on day 7, 3, 1, 0 before due
      if ([7, 3, 1, 0].includes(diffDays)) {
        // check if already sent today
        const lastReminder = schedule.last_reminder_date
          ? new Date(schedule.last_reminder_date)
          : null;
        const today = new Date().toDateString();

        if (!lastReminder || lastReminder.toDateString() !== today) {
          await sendReminderNotification(schedule, diffDays);
        }
      }
    }

    logger.info("Reminder job completed");
  } catch (err) {
    logger.error("reminderJob error:", err);
  }
};

// job 2: mark overdue and send warnings
const overdueJob = async () => {
  logger.info("Running overdue job...");

  try {
    const overdueSchedules = await repaymentService.getOverdue();

    for (const schedule of overdueSchedules) {
      // mark as overdue
      if (schedule.status === "PENDING") {
        await repaymentService.markOverdue(schedule.id);
      }

      const dueDate = new Date(schedule.due_date);
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // send warning every 3 days if overdue
      if (diffDays > 0 && diffDays % 3 === 0) {
        const lastReminder = schedule.last_reminder_date
          ? new Date(schedule.last_reminder_date)
          : null;
        const today = new Date().toDateString();

        if (!lastReminder || lastReminder.toDateString() !== today) {
          await sendReminderNotification(schedule, -diffDays);
        }
      }

      // if overdue > 30 days and reminded > 10 times, notify admin
      if (diffDays > 30 && schedule.reminder_sent >= 10) {
        const admins = await models.users.findAll({
          where: { role: { [Op.in]: [2, 3] }, deleted: 0, status: 1 },
          attributes: ["id"],
        });

        for (const admin of admins) {
          const payload = {
            title: "🚨 Cảnh báo nợ xấu",
            body: `Khoản vay #${schedule.loan_application_id} quá hạn ${diffDays} ngày, đã nhắc ${schedule.reminder_sent} lần.`,
            name: "Cảnh báo nợ xấu",
            content: `Khoản vay #${schedule.loan_application_id} quá hạn ${diffDays} ngày, đã nhắc ${schedule.reminder_sent} lần. Cần xem xét biện pháp xử lý.`,
            type_id: schedule.loan_application_id.toString(),
            type: "8",
            user_id: admin.id.toString(),
          };
          const noti = await notiService.create(payload);
          await notiFcm(admin.id, payload, noti.id);
        }
      }
    }

    logger.info("Overdue job completed");
  } catch (err) {
    logger.error("overdueJob error:", err);
  }
};

// job 3: auto confirm disbursement after 7 days
const autoConfirmDisbursementJob = async () => {
  logger.info("Running auto confirm disbursement job...");

  try {
    const result = await disbursementService.autoConfirmExpired();
    logger.info(`Auto confirmed ${result.count || 0} disbursements`);
  } catch (err) {
    logger.error("autoConfirmDisbursementJob error:", err);
  }
};

// start all cron jobs
const startCronJobs = () => {
  // run reminder job daily at 8am
  cron.schedule("0 8 * * *", reminderJob, {
    timezone: "Asia/Ho_Chi_Minh",
  });

  // run overdue check daily at 9am
  cron.schedule("0 9 * * *", overdueJob, {
    timezone: "Asia/Ho_Chi_Minh",
  });

  // run auto confirm disbursement daily at 10am
  cron.schedule("0 10 * * *", autoConfirmDisbursementJob, {
    timezone: "Asia/Ho_Chi_Minh",
  });

  logger.info("Cron jobs started");
};

module.exports = {
  startCronJobs,
  reminderJob,
  overdueJob,
  autoConfirmDisbursementJob,
};
