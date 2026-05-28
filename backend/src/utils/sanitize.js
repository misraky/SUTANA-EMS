const htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};
const htmlUnescapes = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3D;': '='
};
const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[&<>"'/`=]/g, (char) => htmlEscapes[char]);
};
/**
 * Unescape HTML special characters
 * @param {string} str - String to unescape
 * @returns {string} - Unescaped string
 */
const unescapeHtml = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, (entity) => htmlUnescapes[entity]);
};
/**
 * Remove HTML tags from string
 * @param {string} str - String to sanitize
 * @returns {string} - String without HTML tags
 */
const stripHtml = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
};
/**
 * Sanitize string for SQL (basic escaping - use parameterized queries in production)
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeSql = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
};
/**
 * Remove dangerous characters from input
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (str) => {
  if (!str || typeof str !== 'string') return str;
  let sanitized = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // Remove potential script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove potential javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  // Remove potential on* event handlers
  sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');
  return sanitized.trim();
};
/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase().replace(/[<>]/g, '');
};
/**
 * Sanitize phone number (keep only digits and plus sign)
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[^\d+]/g, '');
};
/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const sanitized = url.trim();
  // Only allow http/https protocols
  if (sanitized.match(/^(https?:\/\/)/i)) {
    return sanitized;
  }
  return '';
};
/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Array} skipFields - Fields to skip sanitization
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj, skipFields = []) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, skipFields));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (skipFields.includes(key)) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, skipFields);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
const sanitizeRequestBody = (req, res, next) => {
  if (req.body) {
    const skipFields = ['content', 'description', 'specialInstructions', 'message'];
    req.body = sanitizeObject(req.body, skipFields);
  }
  next();
};
const sanitizeQueryParams = (req, res, next) => {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeInput(value);
      }
    }
  }
  next();
};
const sanitizePathParams = (req, res, next) => {
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        req.params[key] = sanitizeInput(value);
      }
    }
  }
  next();
};
const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'file';
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};
const sanitizeForResponse = (data) => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForResponse(item));
  }
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (['password', 'token', 'refreshToken', 'twoFactorSecret', 'apiKey', 'secret'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForResponse(value);
      }
    }
    return sanitized;
  }
  if (typeof data === 'string') {
    return data;
  }
  return data;
};
const deepSanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = stripHtml(escapeHtml(sanitizeInput(value)));
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = deepSanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
const sanitizeRedirectUrl = (url, allowedDomains = []) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const isAllowed = allowedDomains.length === 0 || allowedDomains.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
    if (isAllowed && (parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
};
module.exports = {
  escapeHtml,
  unescapeHtml,
  stripHtml,
  sanitizeSql,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizePathParams,
  sanitizeFilename,
  sanitizeForResponse,
  deepSanitize,
  sanitizeRedirectUrl,
  htmlEscapes,
  htmlUnescapes
};
