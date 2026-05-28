const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const logDir = config.logging.dir || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (Object.keys(meta).length > 0 && meta.stack) {
      log += `\n${meta.stack}`;
    } else if (Object.keys(meta).length > 0 && meta.message !== message) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'ISO' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: `${config.backup.retentionDays}d`,
  format: fileFormat,
  level: 'info'
});
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: `${config.backup.retentionDays}d`,
  format: fileFormat,
  level: 'error'
});
const httpRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'http'
});
const auditTransport = new DailyRotateFile({
  filename: path.join(logDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '90d',
  format: fileFormat,
  level: 'audit'
});
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: config.isDevelopment ? 'debug' : 'info'
});
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  audit: 5
};
const logger = winston.createLogger({
  levels: customLevels,
  level: config.logging.level || 'info',
  transports: [
    combinedRotateTransport,
    errorRotateTransport,
    httpRotateTransport,
    consoleTransport
  ],
  exitOnError: false
});
const auditLogger = winston.createLogger({
  levels: { audit: 0 },
  level: 'audit',
  transports: [
    auditTransport
  ],
  exitOnError: false
});
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};
const logWithContext = (level, message, context = {}) => {
  const logEntry = {
    message,
    timestamp: new Date().toISOString(),
    environment: config.env,
    ...context
  };
  logger.log(level, message, logEntry);
};
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  logger.debug(`→ ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id
    });
  });
  next();
};
const audit = (action, userId, details = {}) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    ip: details.ip,
    userAgent: details.userAgent,
    resource: details.resource,
    resourceId: details.resourceId,
    beforeState: details.beforeState,
    afterState: details.afterState,
    status: details.status || 'success',
    reason: details.reason,
    responseTime: details.responseTime
  };
  auditLogger.audit(JSON.stringify(auditEntry));
  logger.info(`AUDIT: ${action} by user ${userId}`, {
    action,
    userId,
    resource: details.resource,
    resourceId: details.resourceId
  });
};
const logError = (error, req = null, context = {}) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context
  };
  if (req) {
    errorLog.url = req.url;
    errorLog.method = req.method;
    errorLog.ip = req.ip;
    errorLog.userId = req.user?.id;
    errorLog.body = req.body;
    errorLog.query = req.query;
    errorLog.params = req.params;
  }
  logger.error(error.message, errorLog);
};
const logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level](`PERF: ${operation} completed in ${duration}ms`, {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};
const logQuery = (sql, bindings, duration, error = null) => {
  if (config.logging.logSqlQueries) {
    const logEntry = {
      sql,
      bindings,
      duration: `${duration}ms`,
      hasError: !!error
    };
    if (error) {
      logger.debug(`SQL Error: ${sql}`, logEntry);
    } else if (duration > 500) {
      logger.warn(`Slow Query (${duration}ms): ${sql}`, logEntry);
    } else {
      logger.debug(`SQL Query: ${sql}`, logEntry);
    }
  }
};
const logEvent = (eventName, data = {}) => {
  logger.info(`EVENT: ${eventName}`, {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...data
  });
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
const getLoggerStats = () => {
  return {
    logDir,
    transports: ['combined', 'error', 'http', 'audit'],
    level: config.logging.level,
    environment: config.env,
    retentionDays: config.backup.retentionDays
  };
};
const flushLogs = () => {
  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
};
module.exports = {
  logger,
  auditLogger,
  morganStream,
  requestLogger,
  audit,
  logError,
  logPerformance,
  logQuery,
  logEvent,
  logAPICall,
  logWithContext,
  getLoggerStats,
  flushLogs
};
