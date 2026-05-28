const config = require('../../config/env');
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    const allowedOrigins = config.allowedOrigins;
    const isAllowed = allowedOrigins.includes(origin) || config.isDevelopment;
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Session-Id',
    'X-API-Key',
    'X-Webhook-Signature',
    'X-Webhook-Source'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 
};
const dynamicCors = (options = {}) => {
  const mergedOptions = { ...corsOptions, ...options };
  return (req, res, next) => {
    const cors = require('cors')(mergedOptions);
    cors(req, res, next);
  };
};
const strictCors = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.allowedOrigins;
  if (origin && !allowedOrigins.includes(origin) && !config.isDevelopment) {
    return res.status(403).json({
      status: 'error',
      message: 'CORS policy: Origin not allowed',
      code: 403
    });
  }
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, X-API-Key');
  res.header('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};
const permissiveCors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};
const corsMiddleware = (options = {}) => {
  const finalOptions = { ...corsOptions, ...options };
  const cors = require('cors');
  return cors(finalOptions);
};
const isValidOrigin = (origin) => {
  if (!origin) return true;
  return config.allowedOrigins.includes(origin) || config.isDevelopment;
};
const getAllowedOrigins = () => {
  return config.allowedOrigins;
};
module.exports = {
  corsOptions,
  corsMiddleware,
  dynamicCors,
  strictCors,
  permissiveCors,
  isValidOrigin,
  getAllowedOrigins
};
