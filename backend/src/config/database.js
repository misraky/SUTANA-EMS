const knex = require('knex');
const mysql = require('mysql2/promise');
const config = require('./env');
const knexConfig = {
  client: 'mysql2',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    timezone: '+03:00', 
    typeCast: function(field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1';
      }
      return next();
    }
  },
  pool: {
    min: config.database.pool.min,
    max: config.database.pool.max,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 60000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  acquireConnectionTimeout: 30000,
  debug: config.logging.logSqlQueries || false,
  log: {
    warn(message) {
      if (config.logging.logSqlQueries) {
        console.warn(`[DB WARN] ${message}`);
      }
    },
    error(message) {
      console.error(`[DB ERROR] ${message}`);
    },
    deprecate(message) {
      if (config.logging.logSqlQueries && config.development.debug) {
        console.log(`[DB DEPRECATE] ${message}`);
      }
    },
    debug(message) {
      if (config.logging.logSqlQueries && config.development.debug) {
        console.log(`[DB DEBUG] ${message}`);
      }
    }
  }
};
const db = knex(knexConfig);
let pool = null;
const getRawPool = async () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: config.database.connectionLimit || config.database.pool.max,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool;
};
const testConnection = async () => {
  try {
    const startTime = Date.now();
    const result = await db.raw('SELECT 1 + 1 AS result');
    const duration = Date.now() - startTime;
    if (result[0][0].result === 2) {
      console.log('✅ Database connected successfully');
      console.log(`   Host: ${config.database.host}:${config.database.port}`);
      console.log(`   Database: ${config.database.database}`);
      console.log(`   Connection time: ${duration}ms`);
      if (config.isDevelopment && config.development.debug) {
        console.log(`   Pool: Min=${config.database.pool.min}, Max=${config.database.pool.max}`);
      }
      return true;
    }
    throw new Error('Database query failed');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (config.isProduction) {
      console.error('Production database connection failed. Exiting...');
      process.exit(1);
    }
    return false;
  }
};
const closeConnection = async () => {
  try {
    await db.destroy();
    if (pool) {
      await pool.end();
    }
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};
const transaction = async (callback) => {
  const trx = await db.transaction();
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};
if (config.logging.logSqlQueries) {
  let queryCount = 0;
  db.on('query', (query) => {
    query.__startTime = Date.now();
    query.__id = ++queryCount;
    if (config.development.debug) {
      console.log(`\n[SQL #${query.__id}] ${query.sql}`);
      if (query.bindings && query.bindings.length) {
        console.log(`[SQL Bindings #${query.__id}]`, query.bindings);
      }
    }
  });
  db.on('query-response', (response, query) => {
    if (query.__startTime) {
      const duration = Date.now() - query.__startTime;
      if (duration > 500) {
        console.warn(`[SQL Slow Query #${query.__id}] ${duration}ms - ${query.sql}`);
      } else if (config.development.debug && duration > 100) {
        console.log(`[SQL Query #${query.__id}] Completed in ${duration}ms`);
      }
    }
  });
  db.on('query-error', (error, query) => {
    console.error(`[SQL Error #${query.__id}] ${error.message}`);
    console.error(`[SQL #${query.__id}] ${query.sql}`);
    if (query.bindings && query.bindings.length) {
      console.error(`[SQL Bindings #${query.__id}]`, query.bindings);
    }
  });
}
module.exports = {
  db,
  getRawPool,
  testConnection,
  closeConnection,
  transaction,
  knexConfig
};
