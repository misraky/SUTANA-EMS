const formatCurrency = (amount, currency = 'ETB') => {
  if (amount === null || amount === undefined) return `0.00 ${currency}`;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `0.00 ${currency}`;
  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${formatted} ${currency}`;
};
const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return '0%';
  return `${number.toFixed(decimals)}%`;
};
const formatDate = (date, locale = 'en-US') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
const formatTime = (date, includeSeconds = false) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
};
const formatEthiopianPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 10)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('251')) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8, 12)}`;
  }
  return phone;
};
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const formatDuration = (ms) => {
  if (ms < 0) return '0ms';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  if (seconds > 0) return `${seconds}s`;
  return `${ms}ms`;
};
const truncate = (str, length = 50, suffix = '...') => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};
/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
};
/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} - Title case string
 */
const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v?\.?vs?\.?)$/i;
  return str.replace(/\w\S*/g, (word, index) => {
    if (index !== 0 && smallWords.test(word)) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  });
};
/**
 * Convert string to slug (URL-friendly)
 * @param {string} str - String to convert
 * @returns {string} - Slug
 */
const toSlug = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} - camelCase string
 */
const toCamelCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '');
};
/**
 * Convert string to snake_case
 * @param {string} str - String to convert
 * @returns {string} - snake_case string
 */
const toSnakeCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/\s+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};
/**
 * Format address lines
 * @param {Object} address - Address object with fields
 * @returns {string} - Formatted address
 */
const formatAddress = (address) => {
  if (!address) return '';
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  return parts.join(', ');
};
/**
 * Format order number with leading zeros
 * @param {number} num - Number to format
 * @param {number} width - Width of the number (default: 4)
 * @returns {string} - Formatted order number
 */
const formatOrderNumber = (num, width = 4) => {
  return num.toString().padStart(width, '0');
};
const formatInvoiceNumber = (prefix, date, sequence) => {
  const dateStr = date.replace(/-/g, '');
  const seqStr = sequence.toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${seqStr}`;
};
const formatJson = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};
const formatError = (error, includeStack = false) => {
  if (!error) return 'Unknown error';
  let message = error.message || String(error);
  if (includeStack && error.stack) {
    message += `\n${error.stack}`;
  }
  return message;
};
module.exports = {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatTime,
  formatEthiopianPhone,
  formatFileSize,
  formatDuration,
  truncate,
  capitalizeWords,
  toTitleCase,
  toSlug,
  toCamelCase,
  toSnakeCase,
  formatAddress,
  formatOrderNumber,
  formatInvoiceNumber,
  formatJson,
  formatError
};
