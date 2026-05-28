const config = require('../../config/env');
const { db, transaction } = require('../../config/database');
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateTokens,
  verifyToken,
  generateTemporaryPassword,
  generateResetToken,
  hashToken
} = require('../../config/auth');
const { audit } = require('../../config/logger');
const { sendEmail, sendPasswordResetEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const crypto = require('crypto');
exports.login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get('user-agent');
  const user = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
    .select(
      'users.*',
      'departments.name as department_name',
      'user_statuses.status_code',
      db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'),
      db.raw('GROUP_CONCAT(DISTINCT roles.permissions) as permission_sets')
    )
    .where(function() {
      this.where('users.email', username)
        .orWhere('users.phone', username);
    })
    .whereNull('users.deleted_at')
    .groupBy('users.id')
    .first();
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status_code !== 'active') {
    throw new AppError('Account is not active. Please contact administrator.', 401);
  }
  // FR-005: Check lockout status before password validation
  const now = new Date();
  if (user.lockout_until && new Date(user.lockout_until) > now) {
    const minutesLeft = Math.ceil((new Date(user.lockout_until) - now) / 60000);
    await audit('LOGIN_BLOCKED_LOCKOUT', user.id, { ip, reason: 'Account locked out' });
    throw new AppError(
      `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      401
    );
  }
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    // FR-005: Increment failed attempts and lock if threshold reached
    const failedAttempts = (user.failed_login_attempts || 0) + 1;
    const maxAttempts = config.session.maxFailedAttempts;
    const updateData = { failed_login_attempts: failedAttempts, updated_at: db.fn.now() };
    if (failedAttempts >= maxAttempts) {
      updateData.lockout_until = new Date(Date.now() + config.session.lockoutMinutes * 60 * 1000);
      updateData.failed_login_attempts = 0;
      await db('users').where('id', user.id).update(updateData);
      await audit('LOGIN_FAILED', user.id, { ip, reason: 'Invalid password — account locked' });
      throw new AppError(
        `Too many failed attempts. Account locked for ${config.session.lockoutMinutes} minutes.`,
        401
      );
    }
    await db('users').where('id', user.id).update(updateData);
    await audit('LOGIN_FAILED', user.id, { ip, reason: 'Invalid password' });
    throw new AppError('Invalid credentials', 401);
  }
  // Clear failed attempts on successful password validation
  await db('users').where('id', user.id).update({
    failed_login_attempts: 0,
    lockout_until: null,
    updated_at: db.fn.now()
  });
  if (user.must_change_password) {
  }
  const roleNames = user.role_names ? user.role_names.split(',') : [];
  let allPermissions = [];
  if (user.permission_sets) {
    const permissionSets = user.permission_sets.split('|||'); 
    for (const permSet of permissionSets) {
      try {
        const perms = JSON.parse(permSet);
        if (perms.all && perms.all.includes('*')) {
          allPermissions = ['*'];
          break;
        }
        for (const resource in perms) {
          for (const action of perms[resource]) {
            allPermissions.push(`${resource}:${action}`);
          }
        }
      } catch (e) {
      }
    }
  }
  allPermissions = [...new Set(allPermissions)];
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    roles: roleNames,
    permissions: allPermissions
  });
  // FR-004: Enforce max concurrent sessions — evict oldest if limit exceeded
  const maxSessions = config.session.maxConcurrentSessions;
  const activeSessions = await db('sessions')
    .where('user_id', user.id)
    .where('expires_at', '>', db.fn.now())
    .orderBy('created_at', 'asc');
  if (activeSessions.length >= maxSessions) {
    const sessionsToRemove = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
    const idsToRemove = sessionsToRemove.map(s => s.id);
    await db('sessions').whereIn('id', idsToRemove).delete();
    await audit('SESSION_EVICTED', user.id, { ip, details: { removedCount: idsToRemove.length, reason: 'Max concurrent sessions reached' } });
  }
  const sessionId = crypto.randomUUID();
  await db('sessions').insert({
    id: sessionId,
    user_id: user.id,
    token: refreshToken,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date(),
    expires_at: new Date(Date.now() + config.session.timeoutMinutes * 60 * 1000)
  });
  await db('users')
    .where('id', user.id)
    .update({ last_login: db.fn.now() });
  await audit('LOGIN_SUCCESS', user.id, { ip, userAgent });
  res.json({
    status: 'success',
    data: {
      token: accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        department: user.department_name,
        roles: roleNames,
        permissions: allPermissions,
        lastLogin: user.last_login,
        mustChangePassword: !!user.must_change_password
      }
    }
  });
});
exports.register = catchAsync(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const ip = req.ip;
  const existingUser = await db('users')
    .where('email', email)
    .orWhere('phone', phone)
    .first();
  if (existingUser) {
    throw new AppError('User with this email or phone already exists', 400);
  }
  const isTemporaryPassword = !password;
  const actualPassword = password || generateTemporaryPassword();
  const hashedPassword = await hashPassword(actualPassword);
  const customerRole = await db('roles').where('name', 'Customer').first();
  const activeStatus = await db('user_statuses').where('status_code', 'active').first();
  const customerDept = await db('departments').where('name', 'Customer').first();
  if (!customerRole) throw new AppError('Customer role is not configured. Please contact administrator.', 500);
  if (!activeStatus) throw new AppError('Active status is not configured. Please contact administrator.', 500);
  if (!customerDept) throw new AppError('Customer department is not configured. Please contact administrator.', 500);
  const result = await transaction(async (trx) => {
    const [userId] = await trx('users').insert({
      full_name: fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      department_id: customerDept.id,
      status_id: activeStatus.id,
      must_change_password: isTemporaryPassword, 
      created_at: db.fn.now()
    });
    await trx('user_roles').insert({
      user_id: userId,
      role_id: customerRole.id
    });
    const walkinType = await trx('customer_types').where('name', 'Regular').first();
    await trx('customers').insert({
      user_id: userId,
      name: fullName,
      email: email.toLowerCase(),
      phone: phone || null,
      customer_type_id: walkinType ? walkinType.id : 1, 
      created_by: userId,
      created_at: db.fn.now()
    });
    return userId;
  });
  if (isTemporaryPassword) {
    await sendEmail({
      to: email,
      subject: 'Welcome to Sutana EMS',
      template: 'welcome',
      data: { name: fullName, email, temporaryPassword: actualPassword, loginUrl: `${config.frontendUrl}/login` }
    }).catch(err => console.error('Email failed:', err.message));
  }
  await audit('USER_REGISTERED', result, { ip, details: { email, phone } });
  res.status(201).json({
    status: 'success',
    message: isTemporaryPassword 
      ? 'Registration successful. Check your email for temporary password.'
      : 'Registration successful. You can now login with your password.'
  });
});
exports.logout = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.headers['x-session-id'];
  const ip = req.ip;
  if (sessionId) {
    await db('sessions').where({ id: sessionId, user_id: userId }).delete();
  }
  await audit('LOGOUT', userId, { ip });
  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
});
exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const ip = req.ip;
  const { valid, decoded, error } = verifyToken(refreshToken, true);
  if (!valid) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  const session = await db('sessions')
    .where({ token: refreshToken, user_id: decoded.userId })
    .where('expires_at', '>', db.fn.now())
    .first();
  if (!session) {
    throw new AppError('Invalid or expired session', 401);
  }
  const user = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .select('users.*', db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'))
    .where('users.id', decoded.userId)
    .groupBy('users.id')
    .first();
  if (!user || user.status_id !== (await db('user_statuses').where('status_code', 'active').first()).id) {
    throw new AppError('User not found or inactive', 401);
  }
  const roleNames = user.role_names ? user.role_names.split(',') : [];
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    roles: roleNames
  });
  await db('sessions')
    .where('id', session.id)
    .update({
      token: newRefreshToken,
      expires_at: new Date(Date.now() + config.session.timeoutMinutes * 60 * 1000)
    });
  res.json({
    status: 'success',
    data: {
      token: newAccessToken,
      refreshToken: newRefreshToken
    }
  });
});
exports.changePassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  const ip = req.ip;
  const user = await db('users').where('id', userId).first();
  if (!user) throw new AppError('User not found', 404);
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) throw new AppError('Current password is incorrect', 401);
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) throw new AppError(passwordValidation.errors.join(', '), 400);
  const hashedPassword = await hashPassword(newPassword);
  await transaction(async (trx) => {
    await trx('password_history').insert({ user_id: userId, password_hash: user.password });
    await trx('users').where('id', userId).update({
      password: hashedPassword,
      must_change_password: false,
      updated_at: db.fn.now()
    });
  });
  await audit('PASSWORD_CHANGED', userId, { ip });
  res.json({
    status: 'success',
    message: 'Password changed successfully'
  });
});
exports.requestPasswordReset = catchAsync(async (req, res) => {
  const { email } = req.body;
  const ip = req.ip;
  const user = await db('users').where('email', email.toLowerCase()).first();
  if (!user) {
    return res.json({ status: 'success', message: 'If an account exists, a reset link will be sent.' });
  }
  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);
  await db('users')
    .where('id', user.id)
    .update({
      reset_token: hashedToken,
      reset_token_expires: db.raw('DATE_ADD(NOW(), INTERVAL 1 HOUR)')
    });
  try {
    await sendPasswordResetEmail(user, resetToken, ip);
    await audit('PASSWORD_RESET_REQUESTED', user.id, { ip });
  } catch (error) {
    console.error('Password reset email error:', error);
    await db('users').where('id', user.id).update({ reset_token: null, reset_token_expires: null });
    throw new AppError('Failed to send reset email. Please try again later.', 500);
  }
  res.json({ status: 'success', message: 'Password reset link has been sent to your email.' });
});
exports.getCurrentUser = catchAsync(async (req, res) => {
  const user = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .select(
      'users.id',
      'users.full_name',
      'users.email',
      'users.phone',
      'departments.name as department',
      'users.last_login',
      'users.must_change_password',
      db.raw('GROUP_CONCAT(DISTINCT roles.name) as roles')
    )
    .where('users.id', req.user.id)
    .groupBy('users.id')
    .first();
  res.json({
    status: 'success',
    data: {
      user: {
        ...user,
        roles: user.roles ? user.roles.split(',') : []
      }
    }
  });
});
exports.confirmPasswordReset = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const ip = req.ip;
  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }
  const hashedToken = hashToken(token);
  const user = await db('users')
    .where('reset_token', hashedToken)
    .where('reset_token_expires', '>', db.fn.now())
    .first();
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(', '), 400);
  }
  const hashedPassword = await hashPassword(newPassword);
  await transaction(async (trx) => {
    await trx('password_history').insert({ user_id: user.id, password_hash: user.password });
    await trx('users').where('id', user.id).update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
      updated_at: db.fn.now()
    });
  });
  await audit('PASSWORD_RESET_COMPLETED', user.id, { ip });
  res.json({ status: 'success', message: 'Password has been reset successfully.' });
});
