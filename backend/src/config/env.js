require('dotenv').config();
const environment = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sutana_ems_dev',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
    connectionLimit: parseInt(process.env.DB_POOL_MAX || '20', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-for-development-only',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    expiryMinutes: parseInt(process.env.JWT_EXPIRY_MINUTES || '60', 10),
    refreshExpiryDays: parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '7', 10),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
  },
  fileUpload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES 
      ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'],
  },
  banks: {
    cbe: {
      enabled: process.env.CBE_API_ENABLED === 'true',
      endpoint: process.env.CBE_API_ENDPOINT,
      apiKey: process.env.CBE_API_KEY,
      webhookSecret: process.env.CBE_WEBHOOK_SECRET,
    },
    dashen: {
      enabled: process.env.DASHEN_API_ENABLED === 'true',
      endpoint: process.env.DASHEN_API_ENDPOINT,
      apiKey: process.env.DASHEN_API_KEY,
      webhookSecret: process.env.DASHEN_WEBHOOK_SECRET,
    },
    awash: {
      enabled: process.env.AWASH_API_ENABLED === 'true',
      endpoint: process.env.AWASH_API_ENDPOINT,
      apiKey: process.env.AWASH_API_KEY,
      webhookSecret: process.env.AWASH_WEBHOOK_SECRET,
    },
    telebirr: {
      enabled: process.env.TELEBIRR_API_ENABLED === 'true',
      endpoint: process.env.TELEBIRR_API_ENDPOINT,
      apiKey: process.env.TELEBIRR_API_KEY,
      webhookSecret: process.env.TELEBIRR_WEBHOOK_SECRET,
    },
  },
  sms: {
    enabled: process.env.AFRICA_TALKING_ENABLED === 'true',
    endpoint: process.env.AFRICA_TALKING_API_ENDPOINT,
    apiKey: process.env.AFRICA_TALKING_API_KEY,
    username: process.env.AFRICA_TALKING_USERNAME,
    senderId: process.env.AFRICA_TALKING_SENDER_ID,
  },
  email: {
    enabled: process.env.SENDGRID_ENABLED === 'true',
    endpoint: process.env.SENDGRID_API_ENDPOINT,
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: process.env.SENDGRID_FROM_NAME,
    sandboxMode: process.env.SENDGRID_SANDBOX_MODE === 'true',
  },
  backup: {
    path: process.env.BACKUP_PATH || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.AWS_BUCKET_NAME,
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logSqlQueries: process.env.LOG_SQL_QUERIES === 'true',
    logDir: process.env.LOG_DIR || './logs',
    debug: process.env.DEBUG === 'true',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },
  session: {
    timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10),
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '3', 10),
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
    lockoutMinutes: parseInt(process.env.LOCKOUT_MINUTES || '15', 10),
  },
  business: {
    taxRate: parseFloat(process.env.TAX_RATE || '15'),
    cashierMaxDiscount: parseFloat(process.env.CASHIER_MAX_DISCOUNT || '5'),
    managerMaxDiscount: parseFloat(process.env.MANAGER_MAX_DISCOUNT || '15'),
    ceoMaxDiscount: parseFloat(process.env.CEO_MAX_DISCOUNT || '25'),
    highValuePoThreshold: parseFloat(process.env.HIGH_VALUE_PO_THRESHOLD || '200000'),
  },
  development: {
    debug: process.env.DEBUG === 'true',
    skipEmailVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true',
    allowTestPayment: process.env.ALLOW_TEST_PAYMENT === 'true',
  },
};
const validateConfig = () => {
  if (environment.isDevelopment) {
    console.log('🔧 Running in DEVELOPMENT mode');
    console.log('⚠️  Using development keys - DO NOT use in production');
    if (environment.jwt.secret === 'dev_jwt_secret_key_do_not_use_in_production_12345') {
      console.warn('⚠️  Using default development JWT secret');
    }
    if (environment.encryption.key === 'dev_32_char_encryption_key_123456') {
      console.warn('⚠️  Using default development encryption key');
    }
    return;
  }
  if (environment.isProduction) {
    const required = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY',
      'DB_PASSWORD',
      'SENDGRID_API_KEY',
      'AFRICA_TALKING_API_KEY'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    if (environment.encryption.key && Buffer.from(environment.encryption.key, 'utf8').length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 bytes for AES-256 in production');
    }
    if (environment.jwt.secret.includes('dev_') || environment.jwt.secret === 'dev_jwt_secret_key_do_not_use_in_production_12345') {
      throw new Error('❌ CRITICAL: Using development JWT secret in production!');
    }
    if (environment.encryption.key.includes('dev_') || environment.encryption.key === 'dev_32_char_encryption_key_123456') {
      throw new Error('❌ CRITICAL: Using development encryption key in production!');
    }
  }
};
const logConfig = () => {
  if (environment.isDevelopment && environment.development.debug) {
    console.log('\n📋 Development Configuration:');
    console.log(`   Database: ${environment.database.user}@${environment.database.host}:${environment.database.port}/${environment.database.database}`);
    console.log(`   Log Level: ${environment.logging.level}`);
    console.log(`   SQL Logging: ${environment.logging.logSqlQueries}`);
    console.log(`   Skip Email Verification: ${environment.development.skipEmailVerification}`);
    console.log(`   Allow Test Payment: ${environment.development.allowTestPayment}`);
    console.log('');
  }
};
// Run validation
try {
  validateConfig();
  logConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  if (environment.isProduction) {
    process.exit(1);
  }
}
module.exports = environment;
