// get pagination params
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

// format paginated response
const getPagingData = (data, page, limit) => {
  const { count: total_items, rows } = data;
  const current_page = page ? +page : 1;
  const total_pages = Math.ceil(total_items / limit);

  return { total_items, total_pages, current_page, rows };
};

// simple pagination helper
const paginate = (page = 1, size = 10) => {
  const limit = Math.min(Math.max(+size, 1), 100); // max 100 items
  const offset = Math.max((+page - 1) * limit, 0);
  return { limit, offset };
};

module.exports = { getPagination, getPagingData, paginate };
