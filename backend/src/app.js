const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('express-async-errors');
const config = require('./config/env');
const { logger, requestLogger, morganStream } = require('./config/logger');
const { testConnection } = require('./config/database');
const { rateLimitMiddleware, authLimiter } = require('./api/middleware/rateLimit.middleware');
const { errorHandler } = require('./api/middleware/errorHandler.middleware');
const { securityHeaders } = require('./api/middleware/security.middleware');
const routes = require('./api/routes');
const cronService = require('./services/cronService');
const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.frontendUrl],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(securityHeaders);
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if ((config.cors && config.cors.allowedOrigins.indexOf(origin) !== -1) || config.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-session-id']
};
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const morgan = require('morgan');
app.use(morgan('combined', { stream: morganStream }));
app.use(requestLogger);
app.use('/api', rateLimitMiddleware);
app.use('/api/v1/auth', authLimiter);
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    services: {
      database: 'unknown'
    }
  };
  try {
    const { db } = require('./config/database');
    await db.raw('SELECT 1');
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
    logger.error('Health check - Database error:', error.message);
  }
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
const path = require('path');
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/v1', routes);
app.get('/api/v1/ping', (req, res) => {
  res.json({
    status: 'success',
    message: 'Sutana EMS API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.url}`,
    code: 404
  });
});
app.use(errorHandler);
let server = null;
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        const { closeConnection } = require('./config/database');
        await closeConnection();
        logger.info('Database connections closed');
        logger.info('Database connections closed');
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
const initializeApp = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected && config.isProduction) {
      throw new Error('Database connection failed in production');
    }

    // Start background services
    cronService.start();

    logger.info('✅ Application initialized successfully');
    logger.info(`   Environment: ${config.env}`);
    logger.info(`   Port: ${config.port}`);
    logger.info(`   Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
    return true;
  } catch (error) {
    logger.error('❌ Application initialization failed:', error);
    throw error;
  }
};
module.exports = {
  app,
  initializeApp,
  gracefulShutdown
};
