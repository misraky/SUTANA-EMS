const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('./env');
const bcryptConfig = {
  saltRounds: 12,
  minPasswordLength: 8
};
const passwordRules = {
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
  requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  historyCount: parseInt(process.env.PASSWORD_HISTORY_COUNT) || 5
};
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(bcryptConfig.saltRounds);
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
  if (password.length < passwordRules.minLength) {
    errors.push(`Password must be at least ${passwordRules.minLength} characters long`);
  }
  if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (passwordRules.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (passwordRules.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    roles: user.roles || [],
    permissions: user.permissions || []
  };
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiryMinutes * 60,
    algorithm: config.jwt.algorithm || 'HS256',
    issuer: 'sutana-ems',
    audience: 'sutana-frontend'
  });
  const refreshToken = jwt.sign(
    { userId: user.id, tokenId: crypto.randomUUID() },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiryDays * 24 * 60 * 60,
      algorithm: config.jwt.algorithm || 'HS256',
      issuer: 'sutana-ems'
    }
  );
  return { accessToken, refreshToken };
};
const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken ? config.jwt.refreshSecret : config.jwt.secret;
    const decoded = jwt.verify(token, secret, {
      algorithms: [config.jwt.algorithm || 'HS256'],
      issuer: 'sutana-ems'
    });
    return { valid: true, decoded };
  } catch (error) {
    return {
      valid: false,
      error: error.name,
      message: error.message
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
const generateTemporaryPassword = () => {
  const length = 12;
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  // Fill remaining
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
const rolePermissions = {
  Admin: ['*'],
  CEO: ['reports:read', 'reports:export', 'dashboard:read', 'approvals:discount', 'approvals:po', 'purchase_orders:read', 'purchase_orders:approve'],
  Finance: ['payments:create', 'payments:read', 'expenses:create', 'expenses:read', 'expenses:update', 'reports:read', 'reports:export'],
  'Printing Supervisor': ['orders:create', 'orders:read', 'orders:update', 'orders:approve', 'inventory:read', 'tax_receipts:create', 'tax_receipts:read'],
  Purchase: ['suppliers:create', 'suppliers:read', 'suppliers:update', 'purchase_orders:create', 'purchase_orders:read', 'purchase_orders:update', 'purchase_orders:approve'],
  'Store Worker': ['inventory:create', 'inventory:read', 'inventory:update', 'receiving:create', 'receiving:read'],
  'Sales/Cashier': ['pos:create', 'pos:read', 'pos:update', 'customers:create', 'customers:read'],
  Customer: ['orders:create', 'orders:read', 'profile:read', 'profile:update']
};
const hasPermission = (userPermissions, requiredPermission) => {
  if (userPermissions.includes('*')) return true;
  if (requiredPermission === '*') return false;
  const [resource, action] = requiredPermission.split(':');
  for (const perm of userPermissions) {
    if (perm === '*') return true;
    if (perm === requiredPermission) return true;
    const [permResource, permAction] = perm.split(':');
    if (permResource === resource && permAction === '*') return true;
    if (permResource === '*' && permAction === action) return true;
  }
  return false;
};
const getPermissionsForRoles = (roles) => {
  const permissions = new Set();
  for (const role of roles) {
    const rolePerms = rolePermissions[role] || [];
    rolePerms.forEach(perm => permissions.add(perm));
  }
  return Array.from(permissions);
};
module.exports = {
  bcryptConfig,
  passwordRules,
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateTokens,
  verifyToken,
  decodeToken,
  generateTemporaryPassword,
  generateResetToken,
  generateVerificationToken,
  hashToken,
  rolePermissions,
  hasPermission,
  getPermissionsForRoles
};
