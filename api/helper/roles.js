const roles = {
  USER: 1,
  ADMIN: 2,
  ADMIN_BANK: 3,
  INVESTORS: 4,
};

// role groups for middleware
const ALL_USERS = [roles.USER, roles.ADMIN, roles.ADMIN_BANK, roles.INVESTORS];
const ADMIN_ONLY = [roles.ADMIN, roles.ADMIN_BANK];
const INVESTORS_ONLY = [roles.INVESTORS, roles.ADMIN];

module.exports = roles;
module.exports.ALL_USERS = ALL_USERS;
module.exports.ADMIN_ONLY = ADMIN_ONLY;
module.exports.INVESTORS_ONLY = INVESTORS_ONLY;
