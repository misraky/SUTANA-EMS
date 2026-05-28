const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const generateAccessToken = (payload, options = {}) => {
  const defaultPayload = {
    userId: payload.id,
    email: payload.email,
    roles: payload.roles || [],
    permissions: payload.permissions || [],
    iat: Math.floor(Date.now() / 1000)
  };
  const tokenOptions = {
    expiresIn: config.jwt.expiresIn,
    algorithm: config.jwt.algorithm,
    issuer: 'sutana-ems',
    audience: 'sutana-frontend',
    ...options
  };
  return jwt.sign(defaultPayload, config.jwt.secret, tokenOptions);
};
const generateRefreshToken = (payload, options = {}) => {
  const tokenId = crypto.randomUUID();
  const defaultPayload = {
    userId: payload.id,
    tokenId: tokenId,
    iat: Math.floor(Date.now() / 1000)
  };
  const tokenOptions = {
    expiresIn: config.jwt.refreshExpiresIn,
    algorithm: config.jwt.algorithm,
    issuer: 'sutana-ems',
    ...options
  };
  return {
    token: jwt.sign(defaultPayload, config.jwt.refreshSecret, tokenOptions),
    tokenId
  };
};
const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, tokenId: refreshTokenId } = generateRefreshToken(user);
  return {
    accessToken,
    refreshToken,
    refreshTokenId
  };
};
const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken ? config.jwt.refreshSecret : config.jwt.secret;
    const decoded = jwt.verify(token, secret, {
      algorithms: [config.jwt.algorithm],
      issuer: 'sutana-ems',
      audience: isRefreshToken ? undefined : 'sutana-frontend'
    });
    return {
      valid: true,
      decoded,
      error: null
    };
  } catch (error) {
    let errorMessage = error.message;
    let errorType = error.name;
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token';
    }
    return {
      valid: false,
      decoded: null,
      error: { type: errorType, message: errorMessage }
    };
  }
};
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
};
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration < new Date();
};
const getTokenRemainingSeconds = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return -1;
  const remaining = (expiration - new Date()) / 1000;
  return Math.max(0, Math.floor(remaining));
};
const generateResetToken = () => {
  const payload = {
    type: 'password_reset',
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1h',
    algorithm: config.jwt.algorithm
  });
};
const generateEmailVerificationToken = (email) => {
  const payload = {
    email,
    type: 'email_verification',
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '24h',
    algorithm: config.jwt.algorithm
  });
};
const verifyEmailToken = (token) => {
  const result = verifyToken(token);
  if (!result.valid) {
    return { valid: false, email: null, error: result.error };
  }
  if (result.decoded.type !== 'email_verification') {
    return { valid: false, email: null, error: { message: 'Invalid token type' } };
  }
  return {
    valid: true,
    email: result.decoded.email,
    error: null
  };
};
const generateApiKey = (clientId) => {
  const payload = {
    clientId,
    type: 'api_key',
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '365d',
    algorithm: config.jwt.algorithm
  });
};
const verifyApiKey = (apiKey) => {
  const result = verifyToken(apiKey);
  if (!result.valid) {
    return { valid: false, clientId: null, error: result.error };
  }
  if (result.decoded.type !== 'api_key') {
    return { valid: false, clientId: null, error: { message: 'Invalid token type' } };
  }
  return {
    valid: true,
    clientId: result.decoded.clientId,
    error: null
  };
};
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
const getUserIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.userId || null;
};
const getRefreshTokenPayload = (userId) => {
  return {
    userId,
    tokenId: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000)
  };
};
const getJWKS = () => {
  return {
    keys: []
  };
};
const getJwtConfig = () => {
  return {
    algorithm: config.jwt.algorithm,
    accessTokenExpiry: config.jwt.expiresIn,
    refreshTokenExpiry: config.jwt.refreshExpiresIn,
    issuer: 'sutana-ems',
    audience: 'sutana-frontend'
  };
};
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  getTokenRemainingSeconds,
  generateResetToken,
  generateEmailVerificationToken,
  verifyEmailToken,
  generateApiKey,
  verifyApiKey,
  extractTokenFromHeader,
  getUserIdFromToken,
  getRefreshTokenPayload,
  getJWKS,
  getJwtConfig
};
