// complaint controller - handles complaint api endpoints

const {
  responseSuccess,
  responseWithError,
} = require("../../helper/messageResponse");
const { ErrorCodes } = require("../../helper/constants");
const complaintService = require("./complaintService");
const logger = require("../../../winston");

// user: create complaint
exports.create = async (req, res) => {
  try {
    const {
      loanApplicationId,
      transactionId,
      complaintType,
      title,
      description,
      evidenceFiles,
      priority,
    } = req.body;

    if (!complaintType || !title || !description) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "Thiếu thông tin bắt buộc"
        )
      );
    }

    const result = await complaintService.create({
      userId: req.user.id,
      loanApplicationId,
      transactionId,
      complaintType,
      title,
      description,
      evidenceFiles,
      priority,
    });

    if (!result.success) {
      return res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, result.error));
    }

    res.json(responseSuccess(result.data, "Tạo khiếu nại thành công"));
  } catch (err) {
    logger.error("create complaint error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// user: get my complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const complaints = await complaintService.getByUser(req.user.id, {
      status,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json(responseSuccess(complaints, "Danh sách khiếu nại"));
  } catch (err) {
    logger.error("getMyComplaints error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// user: add more info to complaint
exports.addMoreInfo = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { additionalInfo, evidenceFiles } = req.body;

    const result = await complaintService.addMoreInfo(
      complaintId,
      req.user.id,
      {
        additionalInfo,
        evidenceFiles,
      }
    );

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.message || result.error
        )
      );
    }

    res.json(responseSuccess(null, "Bổ sung thông tin thành công"));
  } catch (err) {
    logger.error("addMoreInfo error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// get complaint detail
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await complaintService.getById(id);

    if (!complaint) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khiếu nại")
      );
    }

    // user can only view their own
    if (req.user.role === 1 && complaint.user_id !== req.user.id) {
      return res.json(
        responseWithError(ErrorCodes.NOT_ALLOWED, "Không có quyền truy cập")
      );
    }

    res.json(responseSuccess(complaint, "Chi tiết khiếu nại"));
  } catch (err) {
    logger.error("getById complaint error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: get all complaints
exports.getAll = async (req, res) => {
  try {
    const { status, complaintType, priority, limit, offset } = req.query;

    const result = await complaintService.getAll({
      status,
      complaintType,
      priority,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json(
      responseSuccess(
        {
          total: result.count,
          data: result.rows,
        },
        "Danh sách khiếu nại"
      )
    );
  } catch (err) {
    logger.error("getAll complaints error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: assign complaint to self
exports.assignTo = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const result = await complaintService.assignTo(complaintId, req.user.id);

    if (!result.success) {
      return res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, result.error));
    }

    res.json(responseSuccess(null, "Đã nhận xử lý khiếu nại"));
  } catch (err) {
    logger.error("assignTo error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: request more info from user
exports.requestMoreInfo = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.json(
        responseWithError(
          ErrorCodes.INVALID_PARAMETER,
          "Thiếu nội dung yêu cầu"
        )
      );
    }

    const result = await complaintService.requestMoreInfo(
      complaintId,
      req.user.id,
      message
    );

    if (!result.success) {
      return res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, result.error));
    }

    res.json(responseSuccess(null, "Đã gửi yêu cầu bổ sung thông tin"));
  } catch (err) {
    logger.error("requestMoreInfo error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: resolve complaint
exports.resolve = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { accepted, resolution } = req.body;

    if (resolution === undefined || accepted === undefined) {
      return res.json(
        responseWithError(ErrorCodes.INVALID_PARAMETER, "Thiếu thông tin")
      );
    }

    const result = await complaintService.resolve(complaintId, req.user.id, {
      accepted,
      resolution,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.message || result.error
        )
      );
    }

    res.json(
      responseSuccess(
        null,
        accepted ? "Đã giải quyết khiếu nại" : "Đã từ chối khiếu nại"
      )
    );
  } catch (err) {
    logger.error("resolve error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: escalate complaint to higher level
exports.escalate = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { reason } = req.body;

    const result = await complaintService.escalate(
      complaintId,
      req.user.id,
      reason
    );

    if (!result.success) {
      return res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, result.error));
    }

    res.json(responseSuccess(null, "Đã chuyển khiếu nại lên cấp cao"));
  } catch (err) {
    logger.error("escalate error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};
