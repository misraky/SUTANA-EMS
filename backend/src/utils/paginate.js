const DEFAULT_PAGINATION = {
  page: 1,
  limit: 25,
  maxLimit: 100,
  sortBy: 'created_at',
  sortOrder: 'DESC'
};
const getPaginationOptions = (params = {}) => {
  let page = parseInt(params.page, 10);
  let limit = parseInt(params.limit, 10);
  const sortBy = params.sortBy || DEFAULT_PAGINATION.sortBy;
  let sortOrder = params.sortOrder || DEFAULT_PAGINATION.sortOrder;
  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGINATION.page;
  }
  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_PAGINATION.limit;
  } else if (limit > DEFAULT_PAGINATION.maxLimit) {
    limit = DEFAULT_PAGINATION.maxLimit;
  }
  sortOrder = sortOrder.toUpperCase();
  if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
    sortOrder = DEFAULT_PAGINATION.sortOrder;
  }
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sortBy,
    sortOrder
  };
};
const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    }
  };
};
const applyPagination = (query, options = {}) => {
  const { limit, offset, sortBy, sortOrder } = getPaginationOptions(options);
  let paginatedQuery = query.limit(limit).offset(offset);
  if (sortBy) {
    paginatedQuery = paginatedQuery.orderBy(sortBy, sortOrder);
  }
  return paginatedQuery;
};
const paginateQuery = async (query, options = {}) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationOptions(options);
  const countQuery = query.clone();
  const countResult = await countQuery.clearSelect().clearOrder().count('* as total').first();
  const total = parseInt(countResult.total, 10);
  let dataQuery = query;
  if (sortBy) {
    dataQuery = dataQuery.orderBy(sortBy, sortOrder);
  }
  const data = await dataQuery.limit(limit).offset(offset);
  return buildPaginatedResponse(data, total, page, limit);
};
const paginateWithCustomCount = async (dataQuery, countQuery, options = {}) => {
  const { page, limit, offset, sortBy, sortOrder } = getPaginationOptions(options);
  const countResult = await countQuery.first();
  const total = parseInt(countResult.total, 10);
  let query = dataQuery;
  if (sortBy) {
    query = query.orderBy(sortBy, sortOrder);
  }
  const data = await query.limit(limit).offset(offset);
  return buildPaginatedResponse(data, total, page, limit);
};
const generatePaginationLinks = (baseUrl, params, page, totalPages) => {
  const links = {
    self: null,
    first: null,
    last: null,
    next: null,
    prev: null
  };
  const buildUrl = (pageNum) => {
    const urlParams = new URLSearchParams({ ...params, page: pageNum });
    return `${baseUrl}?${urlParams.toString()}`;
  };
  links.self = buildUrl(page);
  links.first = buildUrl(1);
  links.last = buildUrl(totalPages);
  if (page < totalPages) {
    links.next = buildUrl(page + 1);
  }
  if (page > 1) {
    links.prev = buildUrl(page - 1);
  }
  return links;
};
const validatePaginationParams = (params) => {
  const errors = [];
  if (params.page && (isNaN(parseInt(params.page, 10)) || parseInt(params.page, 10) < 1)) {
    errors.push('Page must be a positive integer');
  }
  if (params.limit && (isNaN(parseInt(params.limit, 10)) || parseInt(params.limit, 10) < 1)) {
    errors.push('Limit must be a positive integer');
  }
  if (params.limit && parseInt(params.limit, 10) > DEFAULT_PAGINATION.maxLimit) {
    errors.push(`Limit cannot exceed ${DEFAULT_PAGINATION.maxLimit}`);
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};
const getPageRange = (currentPage, totalPages, surrounding = 2) => {
  const range = [];
  const start = Math.max(1, currentPage - surrounding);
  const end = Math.min(totalPages, currentPage + surrounding);
  if (start > 1) {
    range.push(1);
    if (start > 2) range.push('...');
  }
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) range.push('...');
    range.push(totalPages);
  }
  return range;
};
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return {
    currentPage: page,
    perPage: limit,
    total,
    totalPages,
    from: total > 0 ? from : 0,
    to: total > 0 ? to : 0,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};
const mergePaginationOptions = (options = {}) => {
  return {
    ...DEFAULT_PAGINATION,
    ...options,
    page: options.page || DEFAULT_PAGINATION.page,
    limit: options.limit || DEFAULT_PAGINATION.limit,
    offset: ((options.page || DEFAULT_PAGINATION.page) - 1) * (options.limit || DEFAULT_PAGINATION.limit)
  };
};
module.exports = {
  DEFAULT_PAGINATION,
  getPaginationOptions,
  buildPaginatedResponse,
  applyPagination,
  paginateQuery,
  paginateWithCustomCount,
  generatePaginationLinks,
  validatePaginationParams,
  getPageRange,
  getPaginationMeta,
  mergePaginationOptions
};
