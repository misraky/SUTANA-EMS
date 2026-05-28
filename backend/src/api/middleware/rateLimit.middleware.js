const { limiters } = require('../../config/rateLimit');
module.exports = {
    rateLimitMiddleware: limiters.default,
    authLimiter: limiters.auth,
    loginLimiter: limiters.login,
    apiLimiter: limiters.default
};
