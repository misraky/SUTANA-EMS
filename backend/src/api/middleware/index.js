const authMiddleware = require('./auth.middleware');
const validateMiddleware = require('./validate.middleware');
const rateLimitMiddleware = require('./rateLimit.middleware');
const auditMiddleware = require('./audit.middleware');
const errorHandlerMiddleware = require('./errorHandler.middleware');
const uploadMiddleware = require('./upload.middleware');
const corsMiddleware = require('./cors.middleware');
const compressionMiddleware = require('./compression.middleware');
const helmetMiddleware = require('./helmet.middleware');
const loggingMiddleware = require('./logging.middleware');
const securityMiddleware = require('./security.middleware');
module.exports = {
  authenticate: authMiddleware.authenticate,
  authorize: authMiddleware.authorize,
  authenticateApiKey: authMiddleware.authenticateApiKey,
  validate: validateMiddleware.validate,
  validateParams: validateMiddleware.validateParams,
  validateQuery: validateMiddleware.validateQuery,
  rateLimit: rateLimitMiddleware.rateLimitMiddleware,
  authLimiter: rateLimitMiddleware.authLimiter,
  loginLimiter: rateLimitMiddleware.loginLimiter,
  apiLimiter: rateLimitMiddleware.apiLimiter,
  auditLog: auditMiddleware.auditLog,
  errorHandler: errorHandlerMiddleware.errorHandler,
  notFound: errorHandlerMiddleware.notFound,
  upload: uploadMiddleware,
  cors: corsMiddleware.corsMiddleware,
  compression: compressionMiddleware.compressionMiddleware,
  helmet: helmetMiddleware.helmetMiddleware,
  securityHeaders: securityMiddleware.securityHeaders,
  requestLogger: loggingMiddleware.requestLogger
};
