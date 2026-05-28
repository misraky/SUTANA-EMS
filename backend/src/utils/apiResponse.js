const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    status: 'success',
    message,
    timestamp: new Date().toISOString()
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};
const sendCreated = (res, data = null, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};
const sendNoContent = (res) => {
  return res.status(204).send();
};
const sendError = (res, message = 'Internal server error', statusCode = 500, errors = null, code = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };
  if (errors) {
    response.errors = errors;
  }
  if (code) {
    response.code = code;
  }
  return res.status(statusCode).json(response);
};
const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, message, 400, errors, 'BAD_REQUEST');
};
const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, 401, null, 'UNAUTHORIZED');
};
const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, message, 403, null, 'FORBIDDEN');
};
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 404, null, 'NOT_FOUND');
};
const sendConflict = (res, message = 'Resource conflict') => {
  return sendError(res, message, 409, null, 'CONFLICT');
};
const sendValidationError = (res, errors, message = 'Validation failed') => {
  return sendError(res, message, 422, errors, 'VALIDATION_ERROR');
};
const sendTooManyRequests = (res, message = 'Too many requests', retryAfter = 60) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter
  };
  return res.status(429).json(response);
};
const sendPaginated = (res, data, pagination, message = 'Success') => {
  return sendSuccess(res, {
    items: data,
    pagination
  }, message);
};
const formatPagination = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  };
};
const sendList = (res, data, metadata = null, message = 'Success') => {
  const responseData = { items: data };
  if (metadata) {
    responseData.metadata = metadata;
  }
  return sendSuccess(res, responseData, message);
};
const sendOne = (res, data, message = 'Success') => {
  return sendSuccess(res, data, message);
};
const sendOperationSuccess = (res, message = 'Operation completed successfully', statusCode = 200) => {
  return sendSuccess(res, null, message, statusCode);
};
const sendLoginSuccess = (res, token, refreshToken, user) => {
  return sendSuccess(res, {
    token,
    refreshToken,
    user
  }, 'Login successful');
};
const sendLogoutSuccess = (res) => {
  return sendSuccess(res, null, 'Logged out successfully');
};
const sendTokenRefresh = (res, token, refreshToken) => {
  return sendSuccess(res, { token, refreshToken }, 'Token refreshed successfully');
};
const sendFile = (res, file, filename, contentType) => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(file);
};
const createResponse = (success, data = null, message = '', code = null) => {
  return {
    success,
    data,
    message,
    code,
    timestamp: new Date().toISOString()
  };
};
/**
 * Create success response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Response object
 */
const createSuccessResponse = (data = null, message = 'Success') => {
  return createResponse(true, data, message);
};
const createErrorResponse = (message = 'Error', code = null, data = null) => {
  return createResponse(false, data, message, code);
};
module.exports = {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendTooManyRequests,
  sendPaginated,
  sendList,
  sendOne,
  sendOperationSuccess,
  sendLoginSuccess,
  sendLogoutSuccess,
  sendTokenRefresh,
  sendFile,
  createResponse,
  createSuccessResponse,
  createErrorResponse,
  formatPagination
};
