const slugify = require('slugify');

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'nl'
  });
};

const paginate = (page = 1, limit = 20) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  return { skip, take: parseInt(limit) };
};

const formatPaginatedResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

module.exports = { generateSlug, paginate, formatPaginatedResponse };
