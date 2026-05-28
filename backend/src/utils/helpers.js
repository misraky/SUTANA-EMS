const crypto = require('crypto');
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
const randomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};
const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim().length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};
const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj && obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};
const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};
const sortBy = (array, key, order = 'asc') => {
  const sorted = [...array];
  sorted.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};
const uniqueBy = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};
const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
const flatten = (array) => {
  return [].concat(...array);
};
const unique = (array) => {
  return [...new Set(array)];
};
const intersection = (arr1, arr2) => {
  return arr1.filter(value => arr2.includes(value));
};
const difference = (arr1, arr2) => {
  return arr1.filter(value => !arr2.includes(value));
};
const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
};
const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};
const isFunction = (value) => {
  return typeof value === 'function';
};
const isString = (value) => {
  return typeof value === 'string';
};
const isNumber = (value) => {
  return typeof value === 'number' && !isNaN(value);
};
const isBoolean = (value) => {
  return typeof value === 'boolean';
};
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
};
const toNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};
const env = (key, defaultValue = null) => {
  const value = process.env[key];
  if (value === undefined || value === null) return defaultValue;
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  return value;
};
/**
 * Get current timestamp in various formats
 * @param {string} format - 'iso', 'unix', 'millis'
 * @returns {number|string}
 */
const now = (format = 'iso') => {
  const date = new Date();
  switch (format) {
    case 'unix':
      return Math.floor(date.getTime() / 1000);
    case 'millis':
      return date.getTime();
    default:
      return date.toISOString();
  }
};
const retry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    onRetry = null
  } = options;
  let lastError;
  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        if (onRetry) onRetry(attempt, error);
        await sleep(delay);
        delay *= backoffFactor;
      }
    }
  }
  throw lastError;
};
const timeout = (promise, timeoutMs = 30000, message = 'Operation timed out') => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};
const debounce = (fn, waitMs = 300) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), waitMs);
  };
};
const throttle = (fn, limitMs = 1000) => {
  let inThrottle;
  let lastResult;
  return function(...args) {
    if (!inThrottle) {
      lastResult = fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
    return lastResult;
  };
};
const getNested = (obj, path, defaultValue = null) => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }
  return current !== undefined ? current : defaultValue;
};
const setNested = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[lastKey] = value;
  return obj;
};
const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};
const waitFor = async (conditionFn, intervalMs = 100, timeoutMs = 30000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (await conditionFn()) {
      return;
    }
    await sleep(intervalMs);
  }
  throw new Error('Timeout waiting for condition');
};
module.exports = {
  sleep,
  randomString,
  randomInt,
  deepClone,
  isEmpty,
  pick,
  omit,
  deepMerge,
  setNested,
  getNested,
  shallowEqual,
  groupBy,
  sortBy,
  uniqueBy,
  chunk,
  flatten,
  unique,
  intersection,
  difference,
  isObject,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  toBoolean,
  toNumber,
  env,
  now,
  retry,
  timeout,
  debounce,
  throttle,
  waitFor
};
