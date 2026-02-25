"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    operatorsAliases: 0,
    timezone: "+07:00",

    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle,
    },
  }
);

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("../api/src/user/user.js")(sequelize, Sequelize);
db.chat_room = require("../api/src/chat_room/chat_room.js")(
  sequelize,
  Sequelize
);
db.message = require("../api/src/message/message.js")(sequelize, Sequelize);
db.notification = require("../api/src/notifications/noti.js")(
  sequelize,
  Sequelize
);
db.user_device = require("../api/src/user_device/user_device.js")(
  sequelize,
  Sequelize
);
db.transaction = require("../api/src/transaction/transaction.js")(
  sequelize,
  Sequelize
);
db.loan_application =
  require("../api/src/loan_application/loan_application.js")(
    sequelize,
    Sequelize
  );
db.borrower_information =
  require("../api/src/borrower_information/borrower_information.js")(
    sequelize,
    Sequelize
  );
db.career = require("../api/src/career/career.js")(sequelize, Sequelize);
db.loan_information =
  require("../api/src/loan_information/loan_information.js")(
    sequelize,
    Sequelize
  );
db.address = require("../api/src/address/address.js")(sequelize, Sequelize);
db.category = require("../api/src/category/category.js")(sequelize, Sequelize);
db.product = require("../api/src/product/product.js")(sequelize, Sequelize);
db.product_detail = require("../api/src/product_detail/product_detail.js")(
  sequelize,
  Sequelize
);
db.location = require("../api/src/location/location.js")(sequelize, Sequelize);
db.order = require("../api/src/order/order.js")(sequelize, Sequelize);
db.bank_branch = require("../api/src/bank_branch/bank_branch.js")(
  sequelize,
  Sequelize
);
db.like = require("../api/src/like/like.js")(sequelize, Sequelize);
db.authenticate_point =
  require("../api/src/authenticate_point/authenticate_point.js")(
    sequelize,
    Sequelize
  );
db.car_buying_selling_point =
  require("../api/src/car_buying_selling_car/car_buying_selling_point.js")(
    sequelize,
    Sequelize
  );
db.credit_point = require("../api/src/credit_point/credit_point.js")(
  sequelize,
  Sequelize
);
db.service_point = require("../api/src/service_point/service_point.js")(
  sequelize,
  Sequelize
);
db.point = require("../api/src/point/point.js")(sequelize, Sequelize);
db.banner = require("../api/src/banner/banners.js")(sequelize, Sequelize);
db.bank = require("../api/src/bank/bank.js")(sequelize, Sequelize);
db.question = require("../api/src/question/question.js")(sequelize, Sequelize);
db.answer_question = require("../api/src/answer_question/answer_question.js")(
  sequelize,
  Sequelize
);
db.unlike = require("../api/src/unlike/unlike.js")(sequelize, Sequelize);
db.payment = require("../api/src/payment/payment.js")(sequelize, Sequelize);
db.investors = require("../api/src/investors/investors.js")(
  sequelize,
  Sequelize
);
db.funds = require("../api/src/funds/funds.js")(sequelize, Sequelize);
db.loan_packages = require("../api/src/loan_packages/loan_packages.js")(
  sequelize,
  Sequelize
);
db.appotapay_transaction = require("../api/src/appotapay/appotapay.js")(
  sequelize,
  Sequelize
);
db.repayment_schedule = require("../api/src/repayment/repayment.js")(
  sequelize,
  Sequelize
);
db.complaint = require("../api/src/complaint/complaint.js")(
  sequelize,
  Sequelize
);
db.disbursement = require("../api/src/disbursement/disbursement.js")(
  sequelize,
  Sequelize
);
db.cic_report = require("../api/src/cic/cic.js")(sequelize, Sequelize);
db.compliance_log = require("../api/src/cic/compliance_log.js")(
  sequelize,
  Sequelize
);

// associations

// Loan Application associations
db.loan_application.belongsTo(db.users, { foreignKey: "user_id" });
db.loan_application.belongsTo(db.borrower_information, {
  foreignKey: "borrower_information_id",
});
db.loan_application.belongsTo(db.loan_information, {
  foreignKey: "loan_information_id",
});

// Repayment Schedule associations
db.repayment_schedule.belongsTo(db.loan_application, {
  foreignKey: "loan_application_id",
});
db.repayment_schedule.belongsTo(db.users, { foreignKey: "user_id" });
db.loan_application.hasMany(db.repayment_schedule, {
  foreignKey: "loan_application_id",
});

// Disbursement associations
db.disbursement.belongsTo(db.loan_application, {
  foreignKey: "loan_application_id",
});
db.disbursement.belongsTo(db.investors, { foreignKey: "investor_id" });
db.disbursement.belongsTo(db.users, {
  foreignKey: "borrower_id",
  as: "borrower",
});
db.loan_application.hasOne(db.disbursement, {
  foreignKey: "loan_application_id",
});

// Complaint associations
db.complaint.belongsTo(db.users, { foreignKey: "user_id" });
db.complaint.belongsTo(db.loan_application, {
  foreignKey: "loan_application_id",
});
db.users.hasMany(db.complaint, { foreignKey: "user_id" });

// Borrower Information associations
db.borrower_information.belongsTo(db.career, { foreignKey: "career_id" });

// Compliance Log associations
db.compliance_log.belongsTo(db.loan_application, {
  foreignKey: "loan_application_id",
});
db.compliance_log.belongsTo(db.users, { foreignKey: "user_id" });

module.exports = db;
