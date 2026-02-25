const { ErrorCodes } = require("./constants");

const responseSuccess = (data, message = "Success") => ({
  code: 0,
  status: ErrorCodes.SUCCESS,
  message,
  data,
});

const responseWithError = (errorCode, message = "Error", data = {}) => ({
  code: 1,
  status: errorCode,
  message,
  errors: data,
});

// shorthand helpers
const success = (data, msg) => responseSuccess(data, msg);
const error = (code, msg, data) => responseWithError(code, msg, data);

module.exports = { responseSuccess, responseWithError, success, error };
