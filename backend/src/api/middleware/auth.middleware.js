const jwt = require('jsonwebtoken');
const { db } = require('../../config/database');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const { audit } = require('../../config/logger');
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError('No token provided. Please login.', 401);
    }
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: 'sutana-ems',
        audience: 'sutana-frontend'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired. Please refresh your session.', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token. Please login again.', 401);
      }
      throw new AppError('Authentication failed.', 401);
    }
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      const sessionData = await db('sessions')
        .where({ id: sessionId, user_id: decoded.userId })
        .where('expires_at', '>', db.fn.now())
        .first();
      if (!sessionData) {
        throw new AppError('Session expired. Please login again.', 401);
      }
      // FR-006: Sliding session window — extend expiry on every active request
      const newExpiry = new Date(Date.now() + config.session.timeoutMinutes * 60 * 1000);
      await db('sessions')
        .where('id', sessionId)
        .update({ expires_at: newExpiry });
    }
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
        'users.must_change_password',
        'users.two_factor_enabled',
        db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'),
        db.raw("GROUP_CONCAT(DISTINCT roles.permissions SEPARATOR '|||') as permission_sets")
      )
      .where('users.id', decoded.userId)
      .whereNull('users.deleted_at')
      .groupBy('users.id', 'departments.name', 'user_statuses.status_code')
      .first();
    if (!user) {
      throw new AppError('User not found. Please contact administrator.', 401);
    }
    if (user.status !== 'active') {
      throw new AppError('Account is not active. Please contact administrator.', 401);
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
    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      departmentId: user.department_id,
      departmentName: user.department_name,
      roles: roleNames,
      permissions: allPermissions,
      mustChangePassword: !!user.must_change_password,
      twoFactorEnabled: !!user.two_factor_enabled
    };
    // Force password change on first login before accessing any other API features
    if (req.user.mustChangePassword) {
      const allowedPaths = [
        '/api/v1/auth/change-password',
        '/api/v1/auth/logout',
        '/api/v1/auth/me'
      ];
      const currentPath = req.originalUrl.split('?')[0].replace(/\/$/, '');
      if (!allowedPaths.includes(currentPath)) {
        throw new AppError('Password change required on first login.', 403);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: 'sutana-ems'
      });
      const user = await db('users')
        .select('id', 'full_name', 'email', 'phone')
        .where('id', decoded.userId)
        .whereNull('deleted_at')
        .first();
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone
        };
      }
    } catch (error) {
    }
    next();
  } catch (error) {
    next(error);
  }
};
const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (req.user.permissions.includes('*')) {
      return next();
    }
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    const hasAllPermissions = permissions.every(required => {
      if (req.user.permissions.includes(required)) {
        return true;
      }
      const [resource, action] = required.split(':');
      if (req.user.permissions.includes(`${resource}:*`)) {
        return true;
      }
      return false;
    });
    if (!hasAllPermissions) {
      const missingPermissions = permissions.filter(p => !req.user.permissions.includes(p));
      audit('UNAUTHORIZED_ACCESS_ATTEMPT', req.user.id, {
        ip: req.ip,
        details: {
          url: req.originalUrl,
          method: req.method,
          requiredPermissions: missingPermissions,
          userPermissions: req.user.permissions
        }
      }).catch(() => {});
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
const authorizeRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRole = roles.some(role => req.user.roles.includes(role));
    if (!hasRole) {
      return next(new AppError('Insufficient role privileges', 403));
    }
    next();
  };
};
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      throw new AppError('API key required', 401);
    }
    const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
    if (!validApiKeys.includes(apiKey)) {
      await audit('INVALID_API_KEY_ATTEMPT', null, {
        ip: req.ip,
        details: { apiKey: apiKey.substring(0, 10) + '...' }
      });
      throw new AppError('Invalid API key', 401);
    }
    req.apiKey = {
      key: apiKey,
      type: 'external'
    };
    next();
  } catch (error) {
    next(error);
  }
};
const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  if (user.permissions.includes('*')) return true;
  if (user.permissions.includes(permission)) return true;
  const [resource, action] = permission.split(':');
  return user.permissions.includes(`${resource}:*`);
};
const getPermissionsFromRoles = async (roleNames) => {
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
module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  authorizeRoles,
  authenticateApiKey,
  hasPermission,
  getPermissionsFromRoles,
  extractToken
};
