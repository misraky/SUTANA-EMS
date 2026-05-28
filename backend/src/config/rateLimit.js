const rateLimit = require('express-rate-limit');
const config = require('./env');
const defaultLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  },
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/v1/health';
  }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    });
  }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const username = req.body?.username || req.ip;
    return `login:${username}`;
  },
  skipSuccessfulRequests: true, 
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts. Please try again after 15 minutes.',
      lockoutDuration: 15
    });
  }
});
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 30, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many checkout requests. Please slow down.'
    });
  }
});
const reportLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many report requests. Please wait before generating more reports.'
    });
  }
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 20, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many upload requests. Please wait.'
    });
  }
});
const apiKeyLimiter = (maxRequests = 100, windowMs = 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const apiKey = req.headers['x-api-key'];
      return apiKey || req.ip;
    },
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'API rate limit exceeded.'
      });
    }
  });
};
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const source = req.headers['x-webhook-source'] || req.ip;
    return `webhook:${source}`;
  },
  skip: (req) => {
    return !req.headers['x-webhook-signature'];
  }
});
const createUserRateLimiter = (getLimit) => {
  return rateLimit({
    windowMs: 60 * 1000,
    max: async (req) => {
      if (!req.user) return 100;
      const limit = await getLimit(req.user);
      return limit;
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Rate limit exceeded for your account.'
      });
    }
  });
};
const roleRateLimits = {
  Admin: 500,
  CEO: 300,
  Finance: 200,
  'Printing Supervisor': 200,
  Purchase: 200,
  'Store Worker': 200,
  'Sales/Cashier': 150,
  Customer: 100
};
const getRateLimitForUser = async (user) => {
  if (!user || !user.roles) return 100;
  let maxLimit = 100;
  for (const role of user.roles) {
    const limit = roleRateLimits[role] || 100;
    if (limit > maxLimit) maxLimit = limit;
  }
  return maxLimit;
};
const roleBasedLimiter = createUserRateLimiter(getRateLimitForUser);
const limiters = {
  default: defaultLimiter,
  auth: authLimiter,
  login: loginLimiter,
  checkout: checkoutLimiter,
  report: reportLimiter,
  upload: uploadLimiter,
  webhook: webhookLimiter,
  roleBased: roleBasedLimiter,
  apiKey: apiKeyLimiter
};
module.exports = {
  limiters,
  roleRateLimits,
  getRateLimitForUser
};
