const { audit } = require('../../config/logger');
const { db } = require('../../config/database');
const AUDIT_ACTIONS = {
  CREATE: ['POST'],
  UPDATE: ['PUT', 'PATCH'],
  DELETE: ['DELETE'],
  LOGIN: ['POST'],
  LOGOUT: ['POST'],
  APPROVE: ['POST'],
  EXPORT: ['GET']
};
const AUDIT_RESOURCES = [
  'users',
  'roles',
  'printing_orders',
  'pos_sales',
  'inventory',
  'purchase_orders',
  'expenses',
  'payments',
  'settings',
  'customers',
  'suppliers',
  'products'
];
const shouldAudit = (req) => {
  const method = req.method;
  const isAuditMethod = Object.values(AUDIT_ACTIONS).flat().includes(method);
  if (!isAuditMethod) return false;
  const url = req.originalUrl;
  for (const resource of AUDIT_RESOURCES) {
    if (url.includes(`/${resource}`)) {
      return true;
    }
  }
  if (url.includes('/auth/login') || url.includes('/auth/logout')) {
    return true;
  }
  return false;
};
const extractResource = (url) => {
  for (const resource of AUDIT_RESOURCES) {
    if (url.includes(`/${resource}`)) {
      return resource;
    }
  }
  if (url.includes('/auth/login')) return 'auth';
  if (url.includes('/auth/logout')) return 'auth';
  if (url.includes('/auth/change-password')) return 'auth';
  if (url.includes('/auth/reset-password')) return 'auth';
  return 'unknown';
};
const extractResourceId = (url) => {
  const matches = url.match(/\/(\d+)(?:\/|$)/);
  return matches ? matches[1] : null;
};
const getActionType = (method) => {
  const actionMap = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'GET': 'READ'
  };
  if (method === 'POST' && (this?.url?.includes('/approve') || this?.url?.includes('/submit'))) {
    return 'APPROVE';
  }
  return actionMap[method] || 'UNKNOWN';
};
const captureBeforeState = async (req, resource, resourceId) => {
  if (!resourceId || !resource) return null;
  try {
    let tableName;
    switch (resource) {
      case 'users':
        tableName = 'users';
        break;
      case 'printing_orders':
        tableName = 'printing_orders';
        break;
      case 'pos_sales':
        tableName = 'pos_sales';
        break;
      case 'purchase_orders':
        tableName = 'purchase_orders';
        break;
      case 'customers':
        tableName = 'customers';
        break;
      case 'suppliers':
        tableName = 'suppliers';
        break;
      case 'products':
        tableName = 'products';
        break;
      default:
        return null;
    }
    const result = await db(tableName)
      .where('id', resourceId)
      .first();
    return result;
  } catch (error) {
    console.error('Error capturing before state:', error.message);
    return null;
  }
};
const auditLog = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.json;
  let responseBody = null;
  res.json = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };
  res.on('finish', async () => {
    if (!shouldAudit(req)) return;
    const userId = req.user?.id || null;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    const method = req.method;
    const url = req.originalUrl;
    const statusCode = res.statusCode;
    const action = getActionType.call({ url }, method);
    const resource = extractResource(url);
    const resourceId = extractResourceId(url);
    const responseTime = Date.now() - startTime;
    // Determine if action was successful
    const isSuccess = statusCode >= 200 && statusCode < 300;
    const errorMessage = !isSuccess ? responseBody?.message || `HTTP ${statusCode}` : null;
    // Capture before state for updates and deletes
    let beforeState = null;
    if ((action === 'UPDATE' || action === 'DELETE') && resourceId) {
      beforeState = await captureBeforeState(req, resource, resourceId);
      if (beforeState && beforeState.password) {
        delete beforeState.password;
      }
      if (beforeState && beforeState.two_factor_secret) {
        delete beforeState.two_factor_secret;
      }
    }
    let afterState = null;
    if ((action === 'CREATE' || action === 'UPDATE') && responseBody?.data?.id) {
      afterState = await captureBeforeState(req, resource, responseBody.data.id);
      if (afterState && afterState.password) {
        delete afterState.password;
      }
      if (afterState && afterState.two_factor_secret) {
        delete afterState.two_factor_secret;
      }
    }
    const auditEntry = {
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      before_state: beforeState,
      after_state: afterState,
      ip_address: ip,
      user_agent: userAgent,
      status: isSuccess ? 'success' : 'failure',
      error_message: errorMessage,
      created_at: new Date()
    };
    if ((action === 'CREATE' || action === 'UPDATE') && req.body) {
      const safeBody = { ...req.body };
      delete safeBody.password;
      delete safeBody.currentPassword;
      delete safeBody.newPassword;
      delete safeBody.two_factor_code;
      auditEntry.request_body = safeBody;
    }
    audit(action, userId, {
      ip,
      userAgent,
      resource,
      resourceId,
      beforeState,
      afterState,
      status: isSuccess ? 'success' : 'failure',
      reason: errorMessage,
      responseTime: `${responseTime}ms`
    });
    try {
      await db('audit_logs').insert(auditEntry);
    } catch (error) {
      console.error('Failed to write audit log to database:', error.message);
    }
  });
  next();
};
const auditAuthEvent = async (event, userId, req, details = {}) => {
  const auditEntry = {
    user_id: userId,
    action: event,
    resource: 'auth',
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    status: details.success !== false ? 'success' : 'failure',
    error_message: details.error,
    after_state: details,
    created_at: new Date()
  };
  audit(event, userId, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...details
  });
  try {
    await db('audit_logs').insert(auditEntry);
  } catch (error) {
    console.error('Failed to write auth audit log:', error.message);
  }
};
const auditBatch = async (userId, action, resource, items, req) => {
  const auditEntry = {
    user_id: userId,
    action: `${action}_BATCH`,
    resource,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    after_state: { count: items.length, items: items.map(i => i.id || i) },
    created_at: new Date()
  };
  audit(`${action}_BATCH`, userId, {
    ip: req.ip,
    resource,
    count: items.length
  });
  try {
    await db('audit_logs').insert(auditEntry);
  } catch (error) {
    console.error('Failed to write batch audit log:', error.message);
  }
};
module.exports = {
  auditLog,
  auditAuthEvent,
  auditBatch,
  shouldAudit,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES
};
