/**
 * Server Entry Point
 * Starts the Express server and handles process management
 */

const { app, initializeApp, gracefulShutdown } = require('./src/app');
const config = require('./src/config/env');
const { logger } = require('./src/config/logger');

// Server instance
let server = null;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Initialize application (database, redis, etc.)
    await initializeApp();
    
    // Initialize scheduled cron jobs
    require('./src/services/cron');
    
    // Start listening on configured port
    server = app.listen(config.port, () => {
      logger.info(`🚀 Sutana EMS Server Started`);
      logger.info(`   Environment: ${config.env}`);
      logger.info(`   Port: ${config.port}`);
      logger.info(`   URL: http://localhost:${config.port}`);
      
      if (!config.isProduction) {
        logger.info(`   API Documentation: http://localhost:${config.port}/api-docs`);
        logger.info(`   Health Check: http://localhost:${config.port}/health`);
        logger.info(`   API Ping: http://localhost:${config.port}/api/v1/ping`);
      }
      
      logger.info(`   Timezone: Africa/Addis_Ababa`);
      logger.info(`   Database Pool: ${config.database.pool.min}-${config.database.pool.max}`);
      logger.info(`   Rate Limit: ${config.rateLimit.maxRequests}/min`);
      logger.info(`   Session Timeout: ${config.session.timeoutMinutes} minutes`);
      
      // Log startup banner
      console.log('\n' + '='.repeat(60));
      console.log('  SUTANA ENTERPRISE MANAGEMENT SYSTEM');
      console.log('  Version: 1.0.0');
      console.log(`  Status: ${config.isProduction ? 'PRODUCTION' : config.isStaging ? 'STAGING' : 'DEVELOPMENT'}`);
      console.log(`  Started: ${new Date().toISOString()}`);
      console.log('='.repeat(60) + '\n');
    });

    // Initialize Socket.io
    const io = require('socket.io')(server, {
      cors: {
        origin: config.cors ? config.cors.allowedOrigins : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
      }
    });
    
    // Attach io to app so routes/controllers can access it
    app.set('io', io);

    io.on('connection', (socket) => {
      logger.info(`🔌 Socket client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        logger.info(`🔌 Socket client disconnected: ${socket.id}`);
      });
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });
    
    return server;
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Signal handlers for graceful shutdown
 */
const handleShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  if (server) {
    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error('Error closing server:', err);
        process.exit(1);
      }
      
      logger.info('HTTP server closed');
      await gracefulShutdown(signal);
    });
    
    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle process signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Handle uncaught exceptions (last resort)
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.error('Stack trace:', error.stack);
  
  // Attempt graceful shutdown
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  
  // Unhandled rejections are serious - exit gracefully
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Start the application
startServer();

// Export for testing
module.exports = { startServer, server }; 