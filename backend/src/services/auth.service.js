const { db, transaction } = require('../config/database');
const config = require('../config/env');
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateTokens,
  verifyToken,
  generateTemporaryPassword,
  generateResetToken,
  hashToken
} = require('../config/auth');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { AppError } = require('../utils/AppError');
const crypto = require('crypto');
const login = async (credentials, ip, userAgent) => {
  const { username, password } = credentials;
  const user = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
    .select(
      'users.id',
      'users.full_name',
      'users.email',
      'users.phone',
      'users.password',
      'users.department_id',
      'departments.name as department_name',
      'users.status_id',
      'user_statuses.status_code as status',
      'users.last_login',
      'users.must_change_password',
      'users.two_factor_enabled',
      'users.two_factor_secret',
      db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'),
      db.raw('GROUP_CONCAT(DISTINCT roles.permissions) as permission_sets')
    )
    .where(function() {
      this.where('users.email', username.toLowerCase())
        .orWhere('users.phone', username);
    })
    .whereNull('users.deleted_at')
    .groupBy('users.id', 'departments.name', 'user_statuses.status_code')
    .first();
  if (!user) {
    await incrementFailedAttempts(username);
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status !== 'active') {
    throw new AppError('Account is not active. Please contact administrator.', 401);
  }
  const lockoutKey = `lockout:${user.id}`;
  const isLocked = await redisClient.get(lockoutKey);
  if (isLocked) {
    const ttl = await redisClient.ttl(lockoutKey);
    throw new AppError(`Account locked. Try again in ${Math.ceil(ttl / 60)} minutes.`, 423);
  }
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    await incrementFailedAttempts(user.id);
    await audit('LOGIN_FAILED', user.id, { ip, reason: 'Invalid password' });
    throw new AppError('Invalid credentials', 401);
  }
  if (user.must_change_password) {
    await audit('PASSWORD_CHANGE_REQUIRED', user.id, { ip });
    throw new AppError('Password change required. Please change your password before continuing.', 403);
  }
  const sessionCount = await session.getUserSessionCount(user.id);
  if (sessionCount >= config.session.maxConcurrentSessions) {
    throw new AppError(`Maximum ${config.session.maxConcurrentSessions} concurrent sessions allowed. Please logout from another device.`, 403);
  }
  const roleNames = user.role_names ? user.role_names.split(',') : [];
  const permissions = await getUserPermissions(user.permission_sets);
  let twoFactorRequired = false;
  if (user.two_factor_enabled) {
    twoFactorRequired = true;
    const twoFactorToken = crypto.randomBytes(32).toString('hex');
    return { twoFactorRequired, twoFactorToken };
  }
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    roles: roleNames,
    permissions
  });
  const sessionId = crypto.randomUUID();
  await db('sessions').insert({
    id: sessionId,
    user_id: user.id,
    token: refreshToken,
    ip_address: ip,
    user_agent: userAgent,
    expires_at: new Date(Date.now() + config.session.timeoutMinutes * 60 * 1000)
  });
  await db('users')
    .where('id', user.id)
    .update({ last_login: db.fn.now() });
  await resetFailedAttempts(user.id);
  await audit('LOGIN_SUCCESS', user.id, { ip, userAgent });
  await sendLoginNotification(user, ip, userAgent);
  return {
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      departmentId: user.department_id,
      departmentName: user.department_name,
      roles: roleNames,
      permissions,
      twoFactorEnabled: user.two_factor_enabled,
      mustChangePassword: user.must_change_password
    },
    tokens: { accessToken, refreshToken },
    sessionId
  };
};
const verify2FA = async (token, code, ip, userAgent) => {
  const userId = await redisClient.get(`2fa:${token}`);
  if (!userId) {
    throw new AppError('Invalid or expired 2FA session', 401);
  }
  const user = await db('users')
    .where('id', userId)
    .first();
  if (!user || !user.two_factor_secret) {
    throw new AppError('2FA not enabled for this account', 401);
  }
  const speakeasy = require('speakeasy');
  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: code,
    window: 1
  });
  if (!verified) {
    await audit('2FA_VERIFICATION_FAILED', userId, { ip, reason: 'Invalid code' });
    throw new AppError('Invalid 2FA verification code', 401);
  }
  const fullUser = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .select(
      'users.id',
      'users.full_name',
      'users.email',
      'users.phone',
      'users.department_id',
      'departments.name as department_name',
      db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'),
      db.raw('GROUP_CONCAT(DISTINCT roles.permissions) as permission_sets')
    )
    .where('users.id', userId)
    .groupBy('users.id', 'departments.name')
    .first();
  const roleNames = fullUser.role_names ? fullUser.role_names.split(',') : [];
  const permissions = await getUserPermissions(fullUser.permission_sets);
  const { accessToken, refreshToken } = generateTokens({
    id: fullUser.id,
    email: fullUser.email,
    roles: roleNames,
    permissions
  });
  const sessionId = crypto.randomUUID();
  await db('sessions').insert({
    id: sessionId,
    user_id: fullUser.id,
    token: refreshToken,
    ip_address: ip,
    user_agent: userAgent,
    expires_at: new Date(Date.now() + config.session.timeoutMinutes * 60 * 1000)
  });
  await db('users')
    .where('id', fullUser.id)
    .update({ last_login: db.fn.now() });
  await audit('LOGIN_SUCCESS_2FA', fullUser.id, { ip, userAgent });
  return {
    user: {
      id: fullUser.id,
      fullName: fullUser.full_name,
      email: fullUser.email,
      phone: fullUser.phone,
      departmentId: fullUser.department_id,
      departmentName: fullUser.department_name,
      roles: roleNames,
      permissions,
      twoFactorEnabled: true
    },
    tokens: { accessToken, refreshToken },
    sessionId
  };
};
const logout = async (userId, sessionId, ip) => {
  if (sessionId) {
  }
  await audit('LOGOUT', userId, { ip });
  return true;
};
const refreshToken = async (refreshToken, ip) => {
  const { valid, decoded, error } = verifyToken(refreshToken, true);
  if (!valid) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  const userId = decoded.userId;
  const sessionData = await session.getSession(userId, decoded.tokenId);
  if (!sessionData || sessionData.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }
  const user = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .select('users.*', db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'))
    .where('users.id', userId)
    .groupBy('users.id')
    .first();
  if (!user || user.status !== 'active') {
    throw new AppError('User not found or inactive', 401);
  }
  const roleNames = user.role_names ? user.role_names.split(',') : [];
  const permissions = await getUserPermissionsFromRoles(roleNames);
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    roles: roleNames,
    permissions
  });
  await db('sessions')
    .where('id', sessionData.id)
    .update({
      token: newRefreshToken,
      expires_at: new Date(Date.now() + config.session.timeoutMinutes * 60 * 1000)
    });
  await audit('TOKEN_REFRESHED', userId, { ip });
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};
const changePassword = async (userId, currentPassword, newPassword, ip) => {
  const user = await db('users').where('id', userId).first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 401);
  }
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(', '), 400);
  }
  const passwordHistory = await db('password_history')
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .limit(config.passwordHistoryCount || 5);
  for (const history of passwordHistory) {
    const isReused = await comparePassword(newPassword, history.password_hash);
    if (isReused) {
      throw new AppError('Cannot reuse any of your last 5 passwords', 400);
    }
  }
  const hashedPassword = await hashPassword(newPassword);
  await transaction(async (trx) => {
    await trx('password_history').insert({
      user_id: userId,
      password_hash: user.password
    });
    await trx('users')
      .where('id', userId)
      .update({
        password: hashedPassword,
        must_change_password: false,
        updated_at: db.fn.now()
      });
  });
  await audit('PASSWORD_CHANGED', userId, { ip });
  await sendEmail({
    to: user.email,
    subject: 'Password Changed Successfully',
    template: 'password-changed',
    data: {
      name: user.full_name,
      time: new Date().toISOString(),
      ip
    }
  }).catch(() => {});
  return true;
};
const requestPasswordReset = async (email, ip) => {
  const user = await db('users').where('email', email.toLowerCase()).first();
  if (!user) {
    return true;
  }
  const resetKey = `password_reset:${user.id}`;
  const attempts = await redisClient.incr(resetKey);
  if (attempts === 1) {
  }
  if (attempts > 3) {
    throw new AppError('Too many reset requests. Please try again later.', 429);
  }
  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db('password_resets').insert({
    user_id: user.id,
    token: hashedToken,
    expires_at: expiresAt,
    created_at: db.fn.now()
  });
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    template: 'password-reset',
    data: {
      name: user.full_name,
      resetUrl,
      expiresIn: '1 hour',
      ip
    }
  });
  await audit('PASSWORD_RESET_REQUESTED', user.id, { ip });
  return true;
};
const confirmPasswordReset = async (token, newPassword, ip) => {
  const hashedToken = hashToken(token);
  const resetRecord = await db('password_resets')
    .where('token', hashedToken)
    .where('expires_at', '>', db.fn.now())
    .where('used', false)
    .first();
  if (!resetRecord) {
    throw new AppError('Invalid or expired reset token', 400);
  }
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(', '), 400);
  }
  const user = await db('users').where('id', resetRecord.user_id).first();
  const passwordHistory = await db('password_history')
    .where('user_id', user.id)
    .orderBy('created_at', 'desc')
    .limit(config.passwordHistoryCount || 5);
  for (const history of passwordHistory) {
    const isReused = await comparePassword(newPassword, history.password_hash);
    if (isReused) {
      throw new AppError('Cannot reuse any of your last 5 passwords', 400);
    }
  }
  const hashedPassword = await hashPassword(newPassword);
  await transaction(async (trx) => {
    await trx('password_history').insert({
      user_id: user.id,
      password_hash: user.password
    });
    await trx('users')
      .where('id', user.id)
      .update({
        password: hashedPassword,
        must_change_password: false,
        updated_at: db.fn.now()
      });
    await trx('password_resets')
      .where('id', resetRecord.id)
      .update({ used: true });
  });
  await audit('PASSWORD_RESET_COMPLETED', user.id, { ip });
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Confirmation',
    template: 'password-reset-confirmation',
    data: {
      name: user.full_name,
      time: new Date().toISOString(),
      ip
    }
  });
  return true;
};
const register = async (userData, ip) => {
  const { fullName, email, phone } = userData;
  const existingUser = await db('users')
    .where('email', email.toLowerCase())
    .orWhere('phone', phone)
    .first();
  if (existingUser) {
    throw new AppError('User with this email or phone already exists', 400);
  }
  const tempPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(tempPassword);
  const customerRole = await db('roles').where('name', 'Customer').first();
  if (!customerRole) {
    throw new AppError('Customer role not found', 500);
  }
  const activeStatus = await db('user_statuses').where('status_code', 'active').first();
  const result = await transaction(async (trx) => {
    const [userId] = await trx('users').insert({
      full_name: fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      department_id: (await db('departments').where('name', 'Customer').first())?.id || 7,
      status_id: activeStatus.id,
      must_change_password: true,
      created_at: db.fn.now()
    });
    await trx('user_roles').insert({
      user_id: userId,
      role_id: customerRole.id
    });
    return userId;
  });
  await sendEmail({
    to: email,
    subject: 'Welcome to Sutana EMS',
    template: 'welcome',
    data: {
      name: fullName,
      email,
      temporaryPassword: tempPassword,
      loginUrl: `${config.frontendUrl}/login`
    }
  });
  await sendSMS({
    to: phone,
    message: `Welcome ${fullName} to Sutana EMS! Use email ${email} and the temporary password sent to your email to login. Please change your password after first login.`
  }).catch(() => {});
  await audit('USER_REGISTERED', result, { ip, details: { email, phone } });
  return { userId: result, email };
};
const enable2FA = async (userId) => {
  const speakeasy = require('speakeasy');
  const user = await db('users').where('id', userId).first();
  const secret = speakeasy.generateSecret({
    name: `Sutana EMS (${user.email})`
  });
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secret.otpauth_url)}`
  };
};
const verifyAndEnable2FA = async (userId, code) => {
  const tempSecret = await redisClient.get(`2fa_temp:${userId}`);
  if (!tempSecret) {
    throw new AppError('2FA setup expired. Please try again.', 400);
  }
  const speakeasy = require('speakeasy');
  const verified = speakeasy.totp.verify({
    secret: tempSecret,
    encoding: 'base32',
    token: code,
    window: 1
  });
  if (!verified) {
    throw new AppError('Invalid verification code', 400);
  }
  await db('users')
    .where('id', userId)
    .update({
      two_factor_enabled: true,
      two_factor_secret: tempSecret,
      updated_at: db.fn.now()
    });
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  await db('user_backup_codes').insert(
    backupCodes.map(code => ({
      user_id: userId,
      code,
      created_at: db.fn.now()
    }))
  );
  await audit('2FA_ENABLED', userId, {});
  return { backupCodes };
};
const disable2FA = async (userId, code) => {
  const user = await db('users').where('id', userId).first();
  const speakeasy = require('speakeasy');
  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: code,
    window: 1
  });
  if (!verified) {
    throw new AppError('Invalid verification code', 400);
  }
  await db('users')
    .where('id', userId)
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      updated_at: db.fn.now()
    });
  await db('user_backup_codes').where('user_id', userId).delete();
  await audit('2FA_DISABLED', userId, {});
  return true;
};
const getCurrentUser = async (userId) => {
  const user = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
    .select(
      'users.id',
      'users.full_name',
      'users.email',
      'users.phone',
      'users.department_id',
      'departments.name as department_name',
      'users.status_id',
      'user_statuses.status_code as status',
      'users.last_login',
      'users.created_at',
      'users.two_factor_enabled',
      db.raw('GROUP_CONCAT(DISTINCT roles.name) as roles')
    )
    .where('users.id', userId)
    .groupBy('users.id', 'departments.name', 'user_statuses.status_code')
    .first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return {
    ...user,
    roles: user.roles ? user.roles.split(',') : []
  };
};
const incrementFailedAttempts = async (identifier) => {
  const key = `failed_attempts:${identifier}`;
  const attempts = await redisClient.incr(key);
  if (attempts === 1) {
  }
  if (attempts >= config.session.maxFailedAttempts) {
    const lockoutKey = `lockout:${identifier}`;
  }
};
const resetFailedAttempts = async (userId) => {
};
const getUserPermissions = async (permissionSets) => {
  if (!permissionSets) return [];
  const permissions = new Set();
  const sets = permissionSets.split(',');
  for (const permSet of sets) {
    try {
      const perms = JSON.parse(permSet);
      if (perms.all && perms.all.includes('*')) {
        return ['*'];
      }
      for (const resource in perms) {
        for (const action of perms[resource]) {
          permissions.add(`${resource}:${action}`);
        }
      }
    } catch (e) {
    }
  }
  return Array.from(permissions);
};
const getUserPermissionsFromRoles = async (roleNames) => {
  const roles = await db('roles')
    .whereIn('name', roleNames)
    .select('permissions');
  const permissions = new Set();
  for (const role of roles) {
    const perms = role.permissions;
    if (perms.all && perms.all.includes('*')) {
      return ['*'];
    }
    for (const resource in perms) {
      for (const action of perms[resource]) {
        permissions.add(`${resource}:${action}`);
      }
    }
  }
  return Array.from(permissions);
};
const sendLoginNotification = async (user, ip, userAgent) => {
  const sendNotifications = await db('settings')
    .where('setting_key', 'send_login_notifications')
    .first();
  if (sendNotifications?.setting_value === 'true') {
    await sendEmail({
      to: user.email,
      subject: 'New Login to Your Account',
      template: 'login-notification',
      data: {
        name: user.full_name,
        ip,
        userAgent,
        time: new Date().toISOString()
      }
    }).catch(() => {});
  }
};
module.exports = {
  login,
  verify2FA,
  logout,
  refreshToken,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  register,
  enable2FA,
  verifyAndEnable2FA,
  disable2FA,
  getCurrentUser
};
