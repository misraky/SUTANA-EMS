const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ETHIOPIAN_PHONE_REGEX = /^09[0-9]{8}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email);
};
const isValidEthiopianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return ETHIOPIAN_PHONE_REGEX.test(phone);
};
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};
const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid);
};
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
const isValidInteger = (value, options = {}) => {
  const { min, max, positiveOnly = false } = options;
  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num)) return false;
  if (positiveOnly && num <= 0) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};
const isValidPositiveInteger = (value) => {
  return isValidInteger(value, { positiveOnly: true });
};
const isValidNumber = (value, options = {}) => {
  const { min, max, positiveOnly = false } = options;
  const num = Number(value);
  if (isNaN(num)) return false;
  if (positiveOnly && num <= 0) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};
const isValidPositiveNumber = (value) => {
  return isValidNumber(value, { positiveOnly: true });
};
const isValidDate = (date, format = null) => {
  if (!date) return false;
  if (format) {
    const moment = require('moment');
    return moment(date, format, true).isValid();
  }
  const parsed = new Date(date);
  return parsed instanceof Date && !isNaN(parsed);
};
const isNotPastDate = (date) => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj >= today;
};
const isNotFutureDate = (date) => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dateObj <= today;
};
const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};
const isValidLength = (value, min = 0, max = Infinity) => {
  if (typeof value !== 'string') return false;
  const length = value.length;
  return length >= min && length <= max;
};
const isValidArray = (value, options = {}) => {
  const { minLength = 0, maxLength = Infinity, itemValidator = null } = options;
  if (!Array.isArray(value)) return false;
  if (value.length < minLength) return false;
  if (value.length > maxLength) return false;
  if (itemValidator && typeof itemValidator === 'function') {
    return value.every(item => itemValidator(item));
  }
  return true;
};
const isInEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};
const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};
const hasRequiredProperties = (obj, requiredProps) => {
  if (!isObject(obj)) return false;
  return requiredProps.every(prop => obj.hasOwnProperty(prop) && isRequired(obj[prop]));
};
const isValidTIN = (tin) => {
  if (!tin || typeof tin !== 'string') return false;
  return /^\d{10}$/.test(tin);
};
const isValidBRN = (brn) => {
  if (!brn || typeof brn !== 'string') return false;
  return /^[A-Z0-9]{5,20}$/i.test(brn);
};
const validatePasswordStrength = (password) => {
  const errors = [];
  let score = 0;
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, score: 0 };
  }
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score++;
  }
  if (/[A-Z]/.test(password)) score++;
  else errors.push('Password must contain at least one uppercase letter');
  if (/[a-z]/.test(password)) score++;
  else errors.push('Password must contain at least one lowercase letter');
  if (/[0-9]/.test(password)) score++;
  else errors.push('Password must contain at least one number');
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else errors.push('Password must contain at least one special character');
  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(5, score),
    strength: score >= 4 ? 'strong' : score >= 3 ? 'good' : score >= 2 ? 'fair' : 'weak'
  };
};
const doPasswordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};
const isValidCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  const sanitized = cardNumber.replace(/\s/g, '');
  if (!/^\d+$/.test(sanitized)) return false;
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};
/**
 * Validate expiry date (MM/YY or MM/YYYY)
 * @param {string} expiryDate - Expiry date string
 * @returns {boolean}
 */
const isValidExpiryDate = (expiryDate) => {
  if (!expiryDate || typeof expiryDate !== 'string') return false;
  const clean = expiryDate.replace(/\s/g, '');
  // Check format MM/YY or MM/YYYY
  const patterns = [/^(0[1-9]|1[0-2])\/(\d{2})$/, /^(0[1-9]|1[0-2])\/(\d{4})$/];
  let match = null;
  for (const pattern of patterns) {
    match = clean.match(pattern);
    if (match) break;
  }
  if (!match) return false;
  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  // If year is 2-digit, convert to 4-digit
  if (year < 100) {
    year += 2000;
  }
  const now = new Date();
  const expiry = new Date(year, month, 0); // Last day of the month
  return expiry > now;
};
/**
 * Validate that value is within range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean}
 */
const isInRange = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};
/**
 * Validate that value is one of allowed values
 * @param {any} value - Value to check
 * @param {Array} allowed - Array of allowed values
 * @returns {boolean}
 */
const isAllowedValue = (value, allowed) => {
  return allowed.includes(value);
};
/**
 * Sanitize email (remove invalid characters)
 * @param {string} email - Email to sanitize
 * @returns {string}
 */
const sanitizeEmail = (email) => {
  if (!email) return '';
  return email.trim().toLowerCase();
};
/**
 * Sanitize phone number (remove non-digits)
 * @param {string} phone - Phone number to sanitize
 * @returns {string}
 */
const sanitizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};
const formatValidationErrors = (validationResult) => {
  return validationResult.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));
};
module.exports = {
  isValidEmail,
  isValidEthiopianPhone,
  isValidPhone,
  sanitizeEmail,
  sanitizePhone,
  isValidUUID,
  isValidUrl,
  isValidTIN,
  isValidBRN,
  isValidInteger,
  isValidPositiveInteger,
  isValidNumber,
  isValidPositiveNumber,
  isInRange,
  isValidDate,
  isNotPastDate,
  isNotFutureDate,
  isRequired,
  isValidLength,
  isAllowedValue,
  isValidArray,
  isObject,
  hasRequiredProperties,
  isInEnum,
  validatePasswordStrength,
  doPasswordsMatch,
  isValidCreditCard,
  isValidExpiryDate,
  formatValidationErrors,
  EMAIL_REGEX,
  ETHIOPIAN_PHONE_REGEX,
  UUID_REGEX
};
