const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('../config/env');
const PASSWORD_CONFIG = {
  saltRounds: 12,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  historyCount: 5
};
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(PASSWORD_CONFIG.saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};
const validatePasswordStrength = (password) => {
  const errors = [];
  let score = 0;
  if (!password || password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
  } else {
    score += Math.min(2, Math.floor(password.length / 4));
  }
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }
  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }
  if (PASSWORD_CONFIG.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 1;
  }
  if (PASSWORD_CONFIG.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  }
  // Common password check
  const commonPasswords = [
    'password', '123456', '12345678', '123456789', 'qwerty', 
    'abc123', 'password123', 'admin', 'letmein', 'welcome'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable');
    score = Math.max(0, score - 2);
  }
  if (/(012|123|234|345|456|567|678|789|890)/.test(password)) {
    errors.push('Password contains sequential numbers');
    score = Math.max(0, score - 1);
  }
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains repeated characters');
    score = Math.max(0, score - 1);
  }
  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl'];
  for (const pattern of keyboardPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      errors.push('Password contains keyboard patterns');
      score = Math.max(0, score - 1);
      break;
    }
  }
  score = Math.min(5, Math.max(0, score));
  return {
    isValid: errors.length === 0,
    errors,
    score,
    strength: getStrengthLabel(score)
  };
};
const getStrengthLabel = (score) => {
  if (score >= 4) return 'strong';
  if (score >= 3) return 'good';
  if (score >= 2) return 'fair';
  if (score >= 1) return 'weak';
  return 'very weak';
};
const generateStrongPassword = (length = 12) => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';
  let password = '';
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  // Fill remaining with random characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
/**
 * Generate a temporary password (easier to read)
 * @returns {string} - Temporary password
 */
const generateTemporaryPassword = () => {
  const length = 10;
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const vowels = 'AEIOU';
  const numbers = '23456789';
  let password = '';
  let useVowel = true;
  for (let i = 0; i < length - 2; i++) {
    if (useVowel) {
      password += vowels[Math.floor(Math.random() * vowels.length)];
    } else {
      password += consonants[Math.floor(Math.random() * consonants.length)];
    }
    useVowel = !useVowel;
  }
  // Add numbers at the end
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  return password;
};
/**
 * Generate password reset token
 * @returns {string} - Reset token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
const isPasswordReused = async (newPassword, history) => {
  for (const oldHash of history) {
    const isMatch = await comparePassword(newPassword, oldHash);
    if (isMatch) return true;
  }
  return false;
};
const getPasswordRules = () => {
  return {
    minLength: PASSWORD_CONFIG.minLength,
    requireUppercase: PASSWORD_CONFIG.requireUppercase,
    requireLowercase: PASSWORD_CONFIG.requireLowercase,
    requireNumber: PASSWORD_CONFIG.requireNumber,
    requireSpecial: PASSWORD_CONFIG.requireSpecial,
    historyCount: PASSWORD_CONFIG.historyCount
  };
};
const updatePasswordConfig = (newConfig) => {
  if (newConfig.minLength) PASSWORD_CONFIG.minLength = newConfig.minLength;
  if (newConfig.requireUppercase !== undefined) PASSWORD_CONFIG.requireUppercase = newConfig.requireUppercase;
  if (newConfig.requireLowercase !== undefined) PASSWORD_CONFIG.requireLowercase = newConfig.requireLowercase;
  if (newConfig.requireNumber !== undefined) PASSWORD_CONFIG.requireNumber = newConfig.requireNumber;
  if (newConfig.requireSpecial !== undefined) PASSWORD_CONFIG.requireSpecial = newConfig.requireSpecial;
  if (newConfig.historyCount) PASSWORD_CONFIG.historyCount = newConfig.historyCount;
};
const calculateEntropy = (password) => {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
  if (charsetSize === 0) return 0;
  return Math.log2(Math.pow(charsetSize, password.length));
};
const getStrengthColor = (score) => {
  if (score >= 4) return '#10B981'; 
  if (score >= 3) return '#F59E0B'; 
  if (score >= 2) return '#F97316'; 
  if (score >= 1) return '#EF4444'; 
  return '#6B7280'; 
};
module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateStrongPassword,
  generateTemporaryPassword,
  generateResetToken,
  hashToken,
  isPasswordReused,
  getPasswordRules,
  updatePasswordConfig,
  calculateEntropy,
  getStrengthLabel,
  getStrengthColor,
  PASSWORD_CONFIG
};
