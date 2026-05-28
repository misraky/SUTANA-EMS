class AppError extends Error {
  constructor(message, statusCode = 500, errors = null, code = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(message = 'Bad request', errors = null) {
    return new AppError(message, 400, errors, 'BAD_REQUEST');
  }
  static unauthorized(message = 'Unauthorized access') {
    return new AppError(message, 401, null, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Access forbidden') {
    return new AppError(message, 403, null, 'FORBIDDEN');
  }
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, null, 'NOT_FOUND');
  }
  static conflict(message = 'Resource conflict') {
    return new AppError(message, 409, null, 'CONFLICT');
  }
  static unprocessable(message = 'Unprocessable entity', errors = null) {
    return new AppError(message, 422, errors, 'UNPROCESSABLE_ENTITY');
  }
  static tooManyRequests(message = 'Too many requests') {
    return new AppError(message, 429, null, 'TOO_MANY_REQUESTS');
  }
  static internal(message = 'Internal server error') {
    return new AppError(message, 500, null, 'INTERNAL_SERVER_ERROR');
  }
  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new AppError(message, 503, null, 'SERVICE_UNAVAILABLE');
  }
  static validation(errors) {
    return new AppError('Validation failed', 422, errors, 'VALIDATION_ERROR');
  }
  static database(message = 'Database error occurred') {
    return new AppError(message, 500, null, 'DATABASE_ERROR');
  }
  static authentication(message = 'Authentication required') {
    return new AppError(message, 401, null, 'AUTHENTICATION_REQUIRED');
  }
  static authorization(message = 'Insufficient permissions') {
    return new AppError(message, 403, null, 'INSUFFICIENT_PERMISSIONS');
  }
  static duplicate(entity, field, value) {
    return new AppError(
      `${entity} with this ${field} already exists: ${value}`,
      409,
      [{ field, value, message: `${field} must be unique` }],
      'DUPLICATE_ENTRY'
    );
  }
  static invalidCredentials() {
    return new AppError('Invalid email/phone or password', 401, null, 'INVALID_CREDENTIALS');
  }
  static accountLocked(minutes = 15) {
    return new AppError(
      `Account locked. Please try again in ${minutes} minutes`,
      423,
      null,
      'ACCOUNT_LOCKED'
    );
  }
  static tokenExpired() {
    return new AppError('Token has expired. Please login again', 401, null, 'TOKEN_EXPIRED');
  }
  static invalidToken() {
    return new AppError('Invalid token provided', 401, null, 'INVALID_TOKEN');
  }
  static rateLimitExceeded(retryAfter = 60) {
    const error = new AppError(
      `Too many requests. Please try again in ${retryAfter} seconds`,
      429,
      null,
      'RATE_LIMIT_EXCEEDED'
    );
    error.retryAfter = retryAfter;
    return error;
  }
  static paymentRequired(message = 'Payment required') {
    return new AppError(message, 402, null, 'PAYMENT_REQUIRED');
  }
  static paymentFailed(reason = 'Payment processing failed') {
    return new AppError(reason, 402, null, 'PAYMENT_FAILED');
  }
  static insufficientStock(productName, available) {
    return new AppError(
      `Insufficient stock for ${productName}. Available: ${available}`,
      400,
      null,
      'INSUFFICIENT_STOCK'
    );
  }
  static invalidStatusTransition(fromStatus, toStatus) {
    return new AppError(
      `Invalid status transition from ${fromStatus} to ${toStatus}`,
      400,
      null,
      'INVALID_STATUS_TRANSITION'
    );
  }
  toJSON() {
    return {
      status: this.status,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      errors: this.errors
    };
  }
  toString() {
    return `[${this.name}] ${this.message} (${this.statusCode})`;
  }
}
module.exports = AppError;
