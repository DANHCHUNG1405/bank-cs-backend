// disbursement controller - handles disbursement api endpoints

const {
  responseSuccess,
  responseWithError,
} = require("../../helper/messageResponse");
const { ErrorCodes } = require("../../helper/constants");
const disbursementService = require("./disbursementService");
const models = require("../../../models");
const logger = require("../../../winston");

// investor: create disbursement request when accepting loan
exports.create = async (req, res) => {
  try {
    const { loanApplicationId } = req.body;

    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
    });

    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    if (loan.status !== 2) {
      return res.json(
        responseWithError(
          ErrorCodes.BAD_REQUEST,
          "Khoản vay không ở trạng thái chờ giải ngân"
        )
      );
    }

    // check if disbursement already exists
    const existing = await disbursementService.getByLoanApplication(
      loanApplicationId
    );
    if (existing) {
      return res.json(
        responseWithError(
          ErrorCodes.ITEM_EXISTS,
          "Đã có yêu cầu giải ngân cho khoản vay này"
        )
      );
    }

    const result = await disbursementService.createDisbursement({
      loanApplicationId,
      investorId: req.user.investors_id || req.user.id,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.message || result.error
        )
      );
    }

    // update loan status to waiting disbursement
    await models.loan_application.update(
      { status: 3, updated_date: new Date() }, // status 3 = chờ giải ngân
      { where: { id: loanApplicationId } }
    );

    res.json(responseSuccess(result.data, "Tạo yêu cầu giải ngân thành công"));
  } catch (err) {
    logger.error("create disbursement error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// investor: confirm money transfer
exports.investorTransfer = async (req, res) => {
  try {
    const { disbursementId } = req.params;
    const { transactionId, proofImage, bankCode, accountNo, accountName } =
      req.body;

    const disbursement = await models.disbursement.findOne({
      where: {
        id: disbursementId,
        investor_id: req.user.investors_id || req.user.id,
        deleted: 0,
      },
    });

    if (!disbursement) {
      return res.json(
        responseWithError(
          ErrorCodes.ITEM_NOT_EXIST,
          "Không tìm thấy yêu cầu giải ngân"
        )
      );
    }

    const result = await disbursementService.investorTransfer(disbursementId, {
      transactionId,
      proofImage,
      bankCode,
      accountNo,
      accountName,
    });

    if (!result.success) {
      return res.json(
        responseWithError(
          ErrorCodes.SYSTEM_ERROR,
          result.message || result.error
        )
      );
    }

    res.json(responseSuccess(null, result.message));
  } catch (err) {
    logger.error("investorTransfer error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: transfer money to borrower
exports.transferToBorrower = async (req, res) => {
  try {
    const { disbursementId } = req.params;

    const disbursement = await models.disbursement.findOne({
      where: { id: disbursementId, deleted: 0 },
    });

    if (!disbursement) {
      return res.json(
        responseWithError(
          ErrorCodes.ITEM_NOT_EXIST,
          "Không tìm thấy yêu cầu giải ngân"
        )
      );
    }

    if (disbursement.status !== "INVESTOR_TRANSFERRED") {
      return res.json(
        responseWithError(ErrorCodes.BAD_REQUEST, "Nhà đầu tư chưa chuyển tiền")
      );
    }

    const result = await disbursementService.transferToBorrower(disbursementId);

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
        { transactionId: result.transactionId },
        "Đã chuyển tiền cho người vay"
      )
    );
  } catch (err) {
    logger.error("transferToBorrower error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// borrower: confirm money received
exports.borrowerConfirm = async (req, res) => {
  try {
    const { disbursementId } = req.params;
    const { confirmedAmount } = req.body;

    const result = await disbursementService.borrowerConfirm(
      disbursementId,
      req.user.id,
      {
        confirmedAmount,
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

    res.json(responseSuccess(null, result.message));
  } catch (err) {
    logger.error("borrowerConfirm error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// get disbursement by loan application
exports.getByLoanApplication = async (req, res) => {
  try {
    const { loanApplicationId } = req.params;

    const loan = await models.loan_application.findOne({
      where: { id: loanApplicationId, deleted: 0 },
    });

    if (!loan) {
      return res.json(
        responseWithError(ErrorCodes.ITEM_NOT_EXIST, "Không tìm thấy khoản vay")
      );
    }

    // check permission
    if (req.user.role === 1 && loan.user_id !== req.user.id) {
      return res.json(
        responseWithError(ErrorCodes.NOT_ALLOWED, "Không có quyền truy cập")
      );
    }

    const disbursement = await disbursementService.getByLoanApplication(
      loanApplicationId
    );
    res.json(responseSuccess(disbursement, "Thông tin giải ngân"));
  } catch (err) {
    logger.error("getByLoanApplication error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// investor: get my disbursements
exports.getMyDisbursements = async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const disbursements = await disbursementService.getByInvestor(
      req.user.investors_id || req.user.id,
      {
        status,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
      }
    );

    res.json(responseSuccess(disbursements, "Danh sách giải ngân"));
  } catch (err) {
    logger.error("getMyDisbursements error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};

// admin: get all disbursements
exports.getAll = async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const where = { deleted: 0 };
    if (status) where.status = status;

    const disbursements = await models.disbursement.findAndCountAll({
      where,
      include: [
        {
          model: models.loan_application,
          attributes: ["id", "code_transaction"],
          include: [{ model: models.users, attributes: ["id", "full_name"] }],
        },
      ],
      order: [["created_date", "DESC"]],
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json(
      responseSuccess(
        {
          total: disbursements.count,
          data: disbursements.rows,
        },
        "Danh sách giải ngân"
      )
    );
  } catch (err) {
    logger.error("getAll disbursements error:", err);
    res.json(responseWithError(ErrorCodes.SYSTEM_ERROR, "Lỗi hệ thống"));
  }
};
