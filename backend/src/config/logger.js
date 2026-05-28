const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('./env');
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
    } else if (Object.keys(meta).length > 0) {
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
const auditTransport = new DailyRotateFile({
  filename: path.join(logDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '90d', 
  format: fileFormat,
  level: 'info'
});
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: config.isDevelopment ? 'debug' : 'info'
});
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    audit: 5
  },
  transports: [
    combinedRotateTransport,
    errorRotateTransport,
    consoleTransport
  ],
  exitOnError: false
});
const auditLogger = winston.createLogger({
  level: 'audit',
  levels: {
    audit: 0
  },
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
const audit = async (action, userId, details = {}) => {
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
    reason: details.reason
  };
  auditLogger.audit(JSON.stringify(auditEntry));
  logger.info(`AUDIT: ${action} by user ${userId}`, {
    action,
    userId,
    resource: details.resource,
    resourceId: details.resourceId
  });
  try {
    const { db } = require('./database');
    db('audit_logs').insert({
      user_id: userId || 1, 
      action: action,
      resource: details.resource || action.split('_')[0] || 'SYSTEM',
      resource_id: details.resourceId ? String(details.resourceId) : null,
      before_state: details.beforeState ? JSON.stringify(details.beforeState) : null,
      after_state: details.afterState ? JSON.stringify(details.afterState) : null,
      ip_address: details.ip || '127.0.0.1',
      user_agent: details.userAgent || null,
      status: details.status || 'success',
      error_message: details.reason || null
    }).catch(err => {
      logger.error(`Failed to save audit log to DB (background): ${err.message}`);
    });
  } catch (error) {
    logger.error(`Failed to save audit log to DB: ${error.message}`);
  }
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
  logger.info(`PERF: ${operation} completed in ${duration}ms`, {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
  if (duration > 1000) {
    logger.warn(`Slow operation: ${operation} took ${duration}ms`, metadata);
  }
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
  logWithContext
};
