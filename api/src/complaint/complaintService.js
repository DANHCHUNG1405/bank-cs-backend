const models = require("../../../models");
const { Op } = require("sequelize");
const logger = require("../../../winston");
const notiService = require("../notifications/notiService");
const { notiFcm } = require("../../helper/fcm");

// Tạo khiếu nại mới
exports.create = async (data) => {
  try {
    const complaint = await models.complaint.create({
      user_id: data.userId,
      loan_application_id: data.loanApplicationId,
      transaction_id: data.transactionId,
      complaint_type: data.complaintType,
      title: data.title,
      description: data.description,
      evidence_files: data.evidenceFiles
        ? JSON.stringify(data.evidenceFiles)
        : null,
      priority: data.priority || "MEDIUM",
      created_by: data.userId.toString(),
    });

    // Nếu là tranh chấp, khoá giao dịch liên quan
    if (data.complaintType === "DISPUTE" && data.loanApplicationId) {
      await models.complaint.update(
        { is_transaction_locked: 1 },
        { where: { id: complaint.id } }
      );

      // Khoá khoản vay
      await models.loan_application.update(
        { status: 6, updated_date: new Date() }, // status 6 = đang có tranh chấp
        { where: { id: data.loanApplicationId } }
      );
    }

    // Thông báo cho admin
    const admins = await models.users.findAll({
      where: { role: { [Op.in]: [2, 3] }, deleted: 0, status: 1 },
      attributes: ["id"],
    });

    for (const admin of admins) {
      const payload = {
        title: "Khiếu nại mới",
        body: `Có khiếu nại mới: ${data.title}`,
        name: "Khiếu nại mới",
        content: `Có khiếu nại mới: ${data.title}`,
        type_id: complaint.id.toString(),
        type: "7",
        user_id: admin.id.toString(),
      };
      const noti = await notiService.create(payload);
      notiFcm(admin.id, payload, noti.id);
    }

    return { success: true, data: complaint };
  } catch (err) {
    logger.error("create complaint error:", err);
    return { success: false, error: err.message };
  }
};

// Lấy danh sách khiếu nại của user
exports.getByUser = async (userId, options = {}) => {
  const where = { user_id: userId, deleted: 0 };
  if (options.status) where.status = options.status;

  return models.complaint.findAll({
    where,
    order: [["created_date", "DESC"]],
    limit: options.limit || 20,
    offset: options.offset || 0,
  });
};

// Lấy tất cả khiếu nại (admin)
exports.getAll = async (options = {}) => {
  const where = { deleted: 0 };
  if (options.status) where.status = options.status;
  if (options.complaintType) where.complaint_type = options.complaintType;
  if (options.priority) where.priority = options.priority;

  return models.complaint.findAndCountAll({
    where,
    include: [
      {
        model: models.users,
        attributes: ["id", "full_name", "phone", "email"],
      },
      {
        model: models.loan_application,
        attributes: ["id", "code_transaction"],
      },
    ],
    order: [
      ["priority", "DESC"],
      ["created_date", "ASC"],
    ],
    limit: options.limit || 20,
    offset: options.offset || 0,
  });
};

// Lấy chi tiết khiếu nại
exports.getById = async (id) => {
  return models.complaint.findOne({
    where: { id, deleted: 0 },
    include: [
      {
        model: models.users,
        attributes: ["id", "full_name", "phone", "email"],
      },
      {
        model: models.loan_application,
        include: [
          { model: models.loan_information },
          { model: models.borrower_information },
        ],
      },
    ],
  });
};

// Admin nhận xử lý khiếu nại
exports.assignTo = async (complaintId, adminId) => {
  try {
    await models.complaint.update(
      {
        assigned_to: adminId,
        status: "PROCESSING",
        updated_date: new Date(),
        updated_by: adminId.toString(),
      },
      { where: { id: complaintId } }
    );

    const complaint = await this.getById(complaintId);

    // Thông báo cho người tạo khiếu nại
    const payload = {
      title: "Khiếu nại đang được xử lý",
      body: `Khiếu nại "${complaint.title}" của bạn đang được xử lý.`,
      name: "Khiếu nại đang được xử lý",
      content: `Khiếu nại "${complaint.title}" của bạn đang được xử lý.`,
      type_id: complaintId.toString(),
      type: "7",
      user_id: complaint.user_id.toString(),
    };
    const noti = await notiService.create(payload);
    notiFcm(complaint.user_id, payload, noti.id);

    return { success: true };
  } catch (err) {
    logger.error("assignTo error:", err);
    return { success: false, error: err.message };
  }
};

// Yêu cầu bổ sung thông tin
exports.requestMoreInfo = async (complaintId, adminId, message) => {
  try {
    await models.complaint.update(
      {
        status: "WAITING_INFO",
        resolution: message,
        updated_date: new Date(),
        updated_by: adminId.toString(),
      },
      { where: { id: complaintId } }
    );

    const complaint = await this.getById(complaintId);

    const payload = {
      title: "Yêu cầu bổ sung thông tin",
      body: message,
      name: "Yêu cầu bổ sung thông tin",
      content: message,
      type_id: complaintId.toString(),
      type: "7",
      user_id: complaint.user_id.toString(),
    };
    const noti = await notiService.create(payload);
    notiFcm(complaint.user_id, payload, noti.id);

    return { success: true };
  } catch (err) {
    logger.error("requestMoreInfo error:", err);
    return { success: false, error: err.message };
  }
};

// User bổ sung thông tin
exports.addMoreInfo = async (complaintId, userId, data) => {
  try {
    const complaint = await models.complaint.findOne({
      where: { id: complaintId, user_id: userId, deleted: 0 },
    });

    if (!complaint) {
      return { success: false, message: "Không tìm thấy khiếu nại" };
    }

    let evidenceFiles = [];
    if (complaint.evidence_files) {
      evidenceFiles = JSON.parse(complaint.evidence_files);
    }
    if (data.evidenceFiles) {
      evidenceFiles = evidenceFiles.concat(data.evidenceFiles);
    }

    await models.complaint.update(
      {
        description:
          complaint.description + "\n\n--- Bổ sung ---\n" + data.additionalInfo,
        evidence_files: JSON.stringify(evidenceFiles),
        status: "PROCESSING",
        updated_date: new Date(),
      },
      { where: { id: complaintId } }
    );

    return { success: true };
  } catch (err) {
    logger.error("addMoreInfo error:", err);
    return { success: false, error: err.message };
  }
};

// Giải quyết khiếu nại
exports.resolve = async (complaintId, adminId, data) => {
  try {
    const complaint = await this.getById(complaintId);
    if (!complaint) {
      return { success: false, message: "Không tìm thấy khiếu nại" };
    }

    await models.complaint.update(
      {
        status: data.accepted ? "RESOLVED" : "REJECTED",
        resolution: data.resolution,
        resolution_date: new Date(),
        updated_date: new Date(),
        updated_by: adminId.toString(),
      },
      { where: { id: complaintId } }
    );

    // Mở khoá giao dịch nếu có
    if (complaint.is_transaction_locked && complaint.loan_application_id) {
      await models.loan_application.update(
        { status: 4, updated_date: new Date() }, // Trở về trạng thái đã giải ngân
        { where: { id: complaint.loan_application_id } }
      );
    }

    // Thông báo cho user
    const payload = {
      title: data.accepted
        ? "Khiếu nại đã được giải quyết"
        : "Khiếu nại bị từ chối",
      body: data.resolution,
      name: data.accepted
        ? "Khiếu nại đã được giải quyết"
        : "Khiếu nại bị từ chối",
      content: data.resolution,
      type_id: complaintId.toString(),
      type: "7",
      user_id: complaint.user_id.toString(),
    };
    const noti = await notiService.create(payload);
    notiFcm(complaint.user_id, payload, noti.id);

    return { success: true };
  } catch (err) {
    logger.error("resolve error:", err);
    return { success: false, error: err.message };
  }
};

// Chuyển cấp cao (luật sư/toà án)
exports.escalate = async (complaintId, adminId, reason) => {
  try {
    await models.complaint.update(
      {
        status: "ESCALATED",
        priority: "URGENT",
        resolution: reason,
        updated_date: new Date(),
        updated_by: adminId.toString(),
      },
      { where: { id: complaintId } }
    );

    return { success: true };
  } catch (err) {
    logger.error("escalate error:", err);
    return { success: false, error: err.message };
  }
};
