const crypto = require('crypto');
const config = require('../config/env');
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = config.encryption.key;
const IV_LENGTH = 16; 
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.error('ENCRYPTION_KEY must be exactly 32 characters long');
  if (config.isProduction) {
    process.exit(1);
  }
}
const encrypt = (text) => {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
};
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};
const hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
const hmac = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};
const verifyHmac = (data, signature, secret) => {
  const expectedSignature = hmac(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};
const generateNumericCode = (length = 6) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};
/**
 * Encrypt object (stringify then encrypt)
 * @param {Object} obj - Object to encrypt
 * @returns {string} - Encrypted string
 */
const encryptObject = (obj) => {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString);
};
/**
 * Decrypt object (decrypt then parse)
 * @param {string} encryptedText - Encrypted string
 * @returns {Object} - Decrypted object
 */
const decryptObject = (encryptedText) => {
  const jsonString = decrypt(encryptedText);
  return JSON.parse(jsonString);
};
/**
 * Mask sensitive data (for logging)
 * @param {string} text - Text to mask
 * @param {number} visibleChars - Number of visible characters at start/end
 * @returns {string} - Masked text
 */
const maskSensitiveData = (text, visibleChars = 4) => {
  if (!text || text.length <= visibleChars * 2) {
    return '*'.repeat(text?.length || 0);
  }
  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const middle = '*'.repeat(text.length - (visibleChars * 2));
  return `${start}${middle}${end}`;
};
/**
 * Check if string looks like encrypted data
 * @param {string} text - Text to check
 * @returns {boolean}
 */
const isEncrypted = (text) => {
  if (!text || typeof text !== 'string') return false;
  return text.includes(':') && text.length > 32;
};
const encryptEnvVar = (value) => {
  return encrypt(value);
};
const decryptEnvVar = (encryptedValue) => {
  return decrypt(encryptedValue);
};
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};
const verifyPassword = (password, hashed) => {
  const [salt, storedHash] = hashed.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
};
module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
  hash,
  hmac,
  verifyHmac,
  generateToken,
  generateNumericCode,
  encryptObject,
  decryptObject,
  maskSensitiveData,
  isEncrypted,
  encryptEnvVar,
  decryptEnvVar,
  hashPassword,
  verifyPassword,
  ALGORITHM,
  IV_LENGTH
};
