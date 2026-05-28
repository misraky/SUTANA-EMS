const morgan = require('morgan');
const { logger, morganStream } = require('../../config/logger');
const config = require('../../config/env');
morgan.token('id', (req) => {
  return req.id || req.headers['x-request-id'] || '-';
});
morgan.token('userId', (req) => {
  return req.user?.id || '-';
});
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) return '-';
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
    (res._startAt[1] - req._startAt[1]) / 1e6;
  return Math.round(ms);
});
morgan.token('body', (req) => {
  if (!req.body || Object.keys(req.body).length === 0) return '-';
  const sanitized = { ...req.body };
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  delete sanitized.refreshToken;
  delete sanitized.apiKey;
  return JSON.stringify(sanitized);
});
morgan.token('query', (req) => {
  if (!req.query || Object.keys(req.query).length === 0) return '-';
  return JSON.stringify(req.query);
});
const devFormat = '\x1b[36m:id\x1b[0m :method \x1b[33m:url\x1b[0m :status \x1b[32m:response-time-msms\x1b[0m - :userId - :body';
const prodFormat = JSON.stringify({
  timestamp: ':date[iso]',
  requestId: ':id',
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms',
  userId: ':userId',
  contentLength: ':res[content-length]',
  referrer: ':referrer',
  userAgent: ':user-agent',
  ip: ':remote-addr'
});
const combinedFormat = ':remote-addr - :userId [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-msms';
const morganFormat = config.isDevelopment ? devFormat : prodFormat;
const morganOptions = {
  stream: morganStream,
  skip: (req, res) => {
    if (config.isProduction) {
      const skipPaths = ['/health', '/api/v1/health', '/api/v1/ping'];
      return skipPaths.includes(req.path) || res.statusCode === 304;
    }
    return false;
  }
};
const requestLogger = morgan(morganFormat, morganOptions);
const detailedRequestLogger = (req, res, next) => {
  const startTime = Date.now();
  logger.debug(`→ ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body ? { ...req.body } : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    const message = `← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`;
    logger[level](message, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      contentLength: res.get('content-length')
    });
    if (duration > 1000) {
      logger.warn(`Slow Request: ${req.method} ${req.url} took ${duration}ms`, {
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
    }
  });
  next();
};
const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    statusCode: err.statusCode || 500,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next(err);
};
const logAPICall = (service, method, url, requestData, responseData, duration) => {
  logger.info(`API Call: ${service} ${method} ${url}`, {
    service,
    method,
    url,
    requestSize: requestData ? JSON.stringify(requestData).length : 0,
    responseSize: responseData ? JSON.stringify(responseData).length : 0,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
};
const logBusinessEvent = (event, userId, data = {}) => {
  logger.info(`Business Event: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...data
  });
};
const logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level](`Performance: ${operation} completed in ${duration}ms`, {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};
const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || 
                    req.headers['x-correlation-id'] || 
                    Math.random().toString(36).substring(2, 15);
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
const responseTimeMiddleware = (req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationMs = duration[0] * 1000 + duration[1] / 1e6;
    res.setHeader('X-Response-Time', `${Math.round(durationMs)}ms`);
  });
  next();
};
module.exports = {
  requestLogger,
  detailedRequestLogger,
  errorLogger,
  logAPICall,
  logBusinessEvent,
  logPerformance,
  requestIdMiddleware,
  responseTimeMiddleware,
  morganFormat,
  morganOptions
};
