const config = require('../../config/env');
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (config.cors.allowedOrigins.indexOf(origin) !== -1 || config.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 
};
const addBasicSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.removeHeader('X-Powered-By');
  next();
};
const preventSqlInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\bSELECT\b.*\bFROM\b)/gi,
    /(\bINSERT\b.*\bINTO\b)/gi,
    /(\bUPDATE\b.*\bSET\b)/gi,
    /(\bDELETE\b.*\bFROM\b)/gi,
    /(\bDROP\b.*\bTABLE\b)/gi,
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\bOR\b.*\b=\b.*\b--)/gi,
    /(\bOR\b.*\b=\b.*\b#)/gi,
    /(\bAND\b.*\b=\b.*\b--)/gi,
    /(\bEXEC\b.*\bXP_)/gi,
    /(\bEXECUTE\b.*\bXP_)/gi,
  ];
  const checkForSqlInjection = (obj) => {
    if (!obj) return false;
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        const upperValue = obj[key].toUpperCase();
        for (let pattern of sqlPatterns) {
          if (pattern.test(upperValue)) {
            return true;
          }
        }
      } else if (typeof obj[key] === 'object') {
        if (checkForSqlInjection(obj[key])) return true;
      }
    }
    return false;
  };
  if (checkForSqlInjection(req.body) || checkForSqlInjection(req.query) || checkForSqlInjection(req.params)) {
    console.error('[Security] SQL Injection attempt detected from IP:', req.ip);
    return res.status(400).json({
      success: false,
      error: 'Invalid request parameters',
      code: 'INVALID_PARAMETERS'
    });
  }
  next();
};
const preventXSS = (req, res, next) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /alert\s*\(/gi,
    /prompt\s*\(/gi,
    /confirm\s*\(/gi
  ];
  const checkForXSS = (str) => {
    if (typeof str !== 'string') return false;
    const lowerStr = str.toLowerCase();
    for (let pattern of xssPatterns) {
      if (pattern.test(lowerStr)) return true;
    }
    return false;
  };
  const scanObject = (obj) => {
    if (!obj) return false;
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        if (checkForXSS(obj[key])) return true;
      } else if (typeof obj[key] === 'object') {
        if (scanObject(obj[key])) return true;
      }
    }
    return false;
  };
  if (scanObject(req.body) || scanObject(req.query) || scanObject(req.params)) {
    console.error('[Security] XSS attempt detected from IP:', req.ip);
    return res.status(400).json({
      success: false,
      error: 'Invalid request content',
      code: 'INVALID_CONTENT'
    });
  }
  next();
};
const requestSizeLimiter = (req, res, next) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024; 
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: `Request entity too large. Max size: ${maxSize / (1024 * 1024)}MB`,
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  next();
};
const blockSuspiciousUserAgents = (req, res, next) => {
  const suspiciousAgents = [
    /^$/,
    /curl/i,
    /wget/i,
    /python/i,
    /perl/i,
    /ruby/i,
    /php/i,
    /java/i,
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /burp/i,
    /zap/i,
    /hydra/i,
    /medusa/i
  ];
  const userAgent = req.headers['user-agent'];
  if (!userAgent) {
    if (config.isProduction) {
      console.error('[Security] Request with no User-Agent blocked from IP:', req.ip);
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'FORBIDDEN'
      });
    }
    return next();
  }
  for (let pattern of suspiciousAgents) {
    if (pattern.test(userAgent)) {
      console.error(`[Security] Suspicious User-Agent blocked: ${userAgent} from IP: ${req.ip}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'FORBIDDEN'
      });
    }
  }
  next();
};
const requestLogger = (req, res, next) => {
  if (config.isDevelopment && config.development?.debug) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
  }
  next();
};
const cleanRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === null || req.body[key] === undefined) {
        delete req.body[key];
      }
    });
  }
  next();
};
const securityRateLimit = {
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes'
};
const helmetConfig = addBasicSecurityHeaders;
const sanitizeOptions = {};
module.exports = {
  corsOptions,
  addBasicSecurityHeaders,
  helmetConfig, 
  preventSqlInjection,
  preventXSS,
  requestSizeLimiter,
  blockSuspiciousUserAgents,
  requestLogger,
  cleanRequestBody,
  securityRateLimit,
  sanitizeOptions,
  securityHeaders: addBasicSecurityHeaders,
  sqlInjectionProtection: preventSqlInjection,
  xssProtection: preventXSS,
  sizeLimiter: requestSizeLimiter,
  userAgentFilter: blockSuspiciousUserAgents,
  addSecurityHeaders: addBasicSecurityHeaders,
};
