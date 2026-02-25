const jwt = require("jsonwebtoken");
const models = require("../../models");
const { responseWithError } = require("../helper/messageResponse");
const { ErrorCodes } = require("../helper/constants");

const TOKEN_ERROR_MSG = "Token is invalid or expired";

// get user from token
const getUserFromToken = async (decodedToken) => {
  const user = await models.users.findOne({
    where: { id: decodedToken.id },
    attributes: ["id", "full_name", "role", "email", "phone"],
  });

  if (!user) return null;

  const investors = await models.investors.findOne({
    where: { user_id: user.id, status: 1, deleted: 0 },
    attributes: ["id"],
  });

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_user: 1,
    investors_id: investors?.id || null,
  };
};

// verify token helper
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
};

// check access token middleware
exports.checkAccessToken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.json(
        responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG)
      );
    }

    const token = req.headers.authorization.split(" ")[1];
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      return res.json(
        responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG)
      );
    }

    const user = await getUserFromToken(decoded);
    if (!user) {
      return res.json(
        responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG)
      );
    }

    req.user = user;
    next();
  } catch (err) {
    return res.json(
      responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG, err.message)
    );
  }
};

// optional token check (returns null if no token)
exports.checkAccessTokenOrNot = async (req) => {
  try {
    if (!req.headers.authorization) return null;

    const token = req.headers.authorization.split(" ")[1];
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) return null;

    return await models.users.findOne({
      where: { id: decoded.id },
      attributes: ["id", "full_name", "email", "phone", "role"],
    });
  } catch {
    return null;
  }
};

// check role middleware
exports.checkRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.headers.authorization) {
        return res.json(
          responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG)
        );
      }

      const token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

      if (!decoded) {
        return res.json(
          responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG)
        );
      }

      const user = await getUserFromToken(decoded);
      if (!user) {
        return res.json(
          responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG)
        );
      }

      req.user = user;

      if (roles.length === 0 || roles.includes(user.role)) {
        return next();
      }

      return res.json(responseWithError(ErrorCodes.NOT_ALLOWED, "Not allowed"));
    } catch (err) {
      return res.json(
        responseWithError(ErrorCodes.UNAUTHORIZED, TOKEN_ERROR_MSG, err.message)
      );
    }
  };
};

// verify refresh token
exports.checkRefreshToken = (token) => {
  return verifyToken(token, process.env.REFRESH_TOKEN_SECRET);
};

// sign access token
exports.signAccessToken = (user) => {
  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

// sign refresh token
exports.signRefreshToken = (user) => {
  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};
