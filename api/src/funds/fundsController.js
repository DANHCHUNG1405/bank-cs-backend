const models = require("../../../models/index.js");
const {
  responseSuccess,
  responseWithError,
} = require("../../helper/messageResponse.js");
const logger = require("../../../winston.js");
const { ErrorCodes } = require("../../helper/constants.js");
const Paginator = require("../../commons/paginator");

const fundsService = require("./fundsService.js");
const investorsService = require("../investors/investorsService.js");
const loanApplicationService = require("../loan_application/loan_applicationService.js");
const disbursementService = require("../disbursement/disbursementService.js");
const notiService = require("../notifications/notiService.js");
const { notiFcm } = require("../../helper/fcm.js");
const { host } = require("../../../config/config.json");

//create
exports.create = async (req, res) => {
  try {
    if (req.body.type == 1) {
      // Type 1: Đầu tư vào quỹ
      req.body.investors_id = req.user.investors_id;
      let result = await fundsService.create(req.body);
      if (result.amount_money) {
        const profit = result.amount_money * (result.interest_rate / 100);
        const data_funds = {
          profit: profit,
        };
        await fundsService.update(result.id, data_funds);
      }
      if (result.investors_id) {
        const investors = await investorsService.getById(result.investors_id);
        const deduction = investors.fund - result.amount_money;
        const data_investors = {
          fund: deduction,
        };
        await investorsService.update(investors.id, data_investors);
      }
      res.json(responseSuccess(result));
    } else {
      // Type 2: Cho vay - Chấp nhận yêu cầu vay
      req.body.investors_id = req.user.investors_id;
      const loan_infor = await loanApplicationService.getById(
        req.body.loan_application_id
      );

      if (!loan_infor) {
        return res.json(
          responseWithError(
            ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,
            "Yêu cầu vay không tồn tại"
          )
        );
      }

      req.body.amount_money = loan_infor.loan_information.loan_amount;
      let result = await fundsService.create(req.body);
      const loan_amount = loan_infor.loan_information.loan_amount;

      const investors = await investorsService.getById(result.investors_id);
      const fund_by_investors = investors.fund;
      if (loan_amount > fund_by_investors) {
        res.json(
          responseWithError(
            ErrorCodes.ERROR_CODE_API_NOT_FOUND,
            "Số dư của nhà đầu tư không đủ"
          )
        );
      } else {
        const new_surplus = fund_by_investors - loan_amount;
        const data_investors = {
          fund: new_surplus,
        };
        await investorsService.update(investors.id, data_investors);

        const profit = result.amount_money * (result.interest_rate / 100);
        const data_funds = {
          profit: profit,
        };
        await fundsService.update(result.id, data_funds);

        // Cập nhật trạng thái khoản vay thành "Đang xét duyệt"
        const data_loan_application = {
          status: 2,
        };
        await loanApplicationService.update(
          req.body.loan_application_id,
          data_loan_application
        );

        // Tạo yêu cầu giải ngân
        const disbursementResult = await disbursementService.createDisbursement(
          {
            loanApplicationId: req.body.loan_application_id,
            investorId: req.user.investors_id || req.user.id,
          }
        );

        if (disbursementResult.success) {
          logger.info(
            `Created disbursement for loan ${req.body.loan_application_id}`
          );
        }

        // Gửi thông báo cho người vay
        const payload = {
          title: "Yêu cầu vay được chấp nhận",
          body: `Yêu cầu vay ${loan_infor.code_transaction} của bạn đã được chấp nhận. Vui lòng chờ giải ngân.`,
          name: "Yêu cầu vay được chấp nhận",
          content: `Yêu cầu vay ${loan_infor.code_transaction} của bạn đã được chấp nhận. Vui lòng chờ giải ngân.`,
          type_id: loan_infor.id.toString(),
          type: "3",
          deep_link: `${host.host_deeplink}${host.api_deeplink.loan_application}${loan_infor.id}`,
          user_id: loan_infor.user_id.toString(),
        };
        const noti = await notiService.create(payload);
        notiFcm(loan_infor.user_id, payload, noti.id);

        res.json(
          responseSuccess(
            {
              ...result.dataValues,
              disbursement: disbursementResult.data,
            },
            "Chấp nhận cho vay thành công"
          )
        );
      }
    }
  } catch (error) {
    console.log(error);
    res.json(responseWithError(error));
  }
};

//getAll
exports.getAllPaging = async (req, res) => {
  try {
    const page = parseInt(req.query.page_index) || 1;
    const size = parseInt(req.query.page_size);
    const query = req.query ? req.query : null;
    const { limit, offset } = Paginator.getPagination(page, size);
    let condition = {
      limit,
      offset,
      query,
    };
    const data = await fundsService.getAllPaging(condition);
    const response = Paginator.getPagingData(data, page, limit);
    res.json(
      responseSuccess({
        total_items: response.total_items,
        total_pages: response.total_pages,
        current_page: response.current_page,
        data: response.rows,
      })
    );
  } catch (err) {
    console.log(err);
    res.json(
      responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, "error", err)
    );
  }
};

exports.getFundsByInvestors = async (req, res) => {
  try {
    const page = parseInt(req.query.page_index) || 1;
    const size = parseInt(req.query.page_size);
    const query = req.query ? req.query : null;
    const { limit, offset } = Paginator.getPagination(page, size);
    let condition = {
      limit,
      offset,
      query,
      investors_id: req.user.investors_id,
    };
    const data = await fundsService.getFundsByInvestors(condition);
    const response = Paginator.getPagingData(data, page, limit);
    res.json(
      responseSuccess({
        total_items: response.total_items,
        total_pages: response.total_pages,
        current_page: response.current_page,
        data: response.rows,
      })
    );
  } catch (err) {
    console.log(err);
    res.json(
      responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, "error", err)
    );
  }
};

exports.getFundsByUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page_index) || 1;
    const size = parseInt(req.query.page_size);
    const query = req.query ? req.query : null;
    const { limit, offset } = Paginator.getPagination(page, size);
    let condition = {
      limit,
      offset,
      query,
      user_id: req.user.id,
    };
    const data = await fundsService.getFundsByUser(condition);
    const response = Paginator.getPagingData(data, page, limit);
    res.json(
      responseSuccess({
        total_items: response.total_items,
        total_pages: response.total_pages,
        current_page: response.current_page,
        data: response.rows,
      })
    );
  } catch (err) {
    console.log(err);
    res.json(
      responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, "error", err)
    );
  }
};

exports.getById = async (req, res) => {
  try {
    let id = req.params.id;
    let result = await fundsService.getById(id);
    res.json(responseSuccess(result));
  } catch (error) {
    res.json(responseWithError(error));
  }
};

//delete
exports.delete = async (req, res) => {
  try {
    let id = req.params.id;
    let result = await fundsService.delete(id);
    res.json(responseSuccess(result));
  } catch (error) {
    res.json(responseWithError(error));
  }
};

//update
exports.update = async (req, res) => {
  try {
    let id = req.params.id;
    await fundsService.update(id, req.body);
    res.json(responseSuccess());
  } catch (error) {
    res.json(responseWithError(error));
  }
};
