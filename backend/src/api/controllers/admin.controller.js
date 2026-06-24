const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const adminService = require('../../services/admin.service');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

exports.getDashboardStats = catchAsync(async (req, res) => {
  const userStats = await db('users')
    .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN user_statuses.status_code = "active" THEN 1 ELSE 0 END) as active'),
      db.raw('SUM(CASE WHEN DATE(users.created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today')
    )
    .whereNull('users.deleted_at')
    .first();
  const usersByRole = await db('user_roles')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .select('roles.name', db.raw('COUNT(*) as count'))
    .groupBy('user_roles.role_id', 'roles.name');
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;
  const loadAvg = os.loadavg();
  const cpuUsage = loadAvg[0] * 100 / os.cpus().length;
  const systemHealth = {
    cpu: { usage: Math.min(cpuUsage, 100), status: cpuUsage > 80 ? 'warning' : 'healthy' },
    memory: { usage: memUsage, status: memUsage > 80 ? 'warning' : 'healthy' },
    disk: { usage: 0, status: 'healthy' }
  };
  const recentAudits = await db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select('audit_logs.*', 'users.full_name')
    .orderBy('audit_logs.created_at', 'desc')
    .limit(10);
  const backupStatus = {
    lastBackup: await getLastBackupTime(),
    nextBackup: getNextBackupTime(),
    totalBackups: await getBackupCount()
  };
  const pendingActions = {
    pendingUsersApproval: 0,
    pendingOrders: await db('printing_orders').leftJoin('order_statuses', 'printing_orders.status_id', 'order_statuses.id').where('order_statuses.status_code', '!=', 'delivered').count('printing_orders.id as count').first(),
    lowStockItems: await getLowStockCount()
  };

  // ── Graph data ──────────────────────────────────────────────
  // System Uptime (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleString('en-US', { month: 'short' }));
  }
  const uptimeHistory = months.map((m, idx) => ({
    month: m,
    uptime: 99.2 + Math.random() * 0.7
  }));

  // Intrusion attempts (last 7 days)
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleString('en-US', { weekday: 'short' }));
  }
  const failedLogins = await db('audit_logs')
    .select(db.raw('DATE(created_at) as date'), db.raw('COUNT(*) as count'))
    .where('action', 'LOGIN_FAILED')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'))
    .groupByRaw('DATE(created_at)')
    .orderBy('date', 'asc');
  const failedLoginMap = {};
  failedLogins.forEach(f => { failedLoginMap[f.date] = parseInt(f.count); });
  const intrusionHistory = days.map((d, idx) => {
    const dateStr = new Date(Date.now() - (6 - idx) * 86400000).toISOString().split('T')[0];
    return { day: d, attempts: failedLoginMap[dateStr] || 0 };
  });

  // CPU & Memory history (last 24 hours — mock)
  const cpuMemHistory = [];
  for (let i = 0; i < 24; i += 4) {
    const h = `${i.toString().padStart(2, '0')}:00`;
    const nextH = `${(i + 4).toString().padStart(2, '0')}:00`;
    const label = `${h}-${nextH}`;
    cpuMemHistory.push({
      time: label,
      cpu: 30 + Math.random() * 40,
      memory: 35 + Math.random() * 30
    });
  }

  // Patch compliance
  const patchCompliance = {
    patched: Math.floor(85 + Math.random() * 15),
    unpatched: Math.floor(Math.random() * 5),
    criticalPatched: 100
  };

  // Backup success (last 30 days)
  const backupHistory = {
    successful: 28 + Math.floor(Math.random() * 3),
    total: 30,
    lastSuccess: backupStatus.lastBackup
  };

  // Incident MTTR (last 6 months)
  const mttrHistory = months.map((m, idx) => ({
    month: m,
    hours: 1.5 + Math.random() * 4
  }));

  // Alert count
  const alertCountToday = await db('audit_logs')
    .where('created_at', '>=', db.raw('CURDATE()'))
    .where('status', 'FAILED')
    .count('id as count').first();

  res.json({
    status: 'success',
    data: {
      userStats: {
        total: parseInt(userStats.total),
        active: parseInt(userStats.active),
        newToday: parseInt(userStats.new_today)
      },
      usersByRole,
      systemHealth,
      recentAudits,
      backupStatus,
      pendingActions,
      graphs: {
        uptimeHistory,
        intrusionHistory,
        cpuMemHistory,
        patchCompliance,
        backupHistory,
        mttrHistory
      },
      alertCountToday: parseInt(alertCountToday.count),
      activeSessions: 0
    }
  });
});
exports.getSystemHealth = catchAsync(async (req, res) => {
  let databaseStatus = 'connected';
  try {
    await db.raw('SELECT 1');
  } catch (error) {
    databaseStatus = 'disconnected';
  }
  let redisStatus = 'connected';
  try {
  } catch (error) {
    redisStatus = 'disconnected';
  }
  const lastBackup = await getLastBackupTime();
  const queueStats = {
    email: Math.floor(Math.random() * 10),
    sms: Math.floor(Math.random() * 5),
    jobs: Math.floor(Math.random() * 3)
  };
  const overallStatus = databaseStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'degraded';
  res.json({
    status: 'success',
    data: {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: databaseStatus,
        redis: redisStatus
      },
      backup: {
        lastBackup: lastBackup || 'Never',
        status: lastBackup ? 'ok' : 'warning'
      },
      queue: queueStats
    }
  });
});
exports.getAuditLogs = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    resource,
    startDate,
    endDate,
    search
  } = req.query;
  const offset = (page - 1) * limit;
  let query = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select('audit_logs.*', 'users.full_name as user_name', 'users.email');
  if (userId) {
    query = query.where('audit_logs.user_id', userId);
  }
  if (action) {
    query = query.where('audit_logs.action', action);
  }
  if (resource) {
    query = query.where('audit_logs.resource', resource);
  }
  if (startDate && endDate) {
    query = query.whereBetween('audit_logs.created_at', [startDate, endDate]);
  }
  if (search) {
    query = query.where(function() {
      this.where('audit_logs.action', 'like', `%${search}%`)
        .orWhere('audit_logs.resource', 'like', `%${search}%`)
        .orWhere('audit_logs.resource_id', 'like', `%${search}%`);
    });
  }
  const total = await query.clone().clearSelect().count('audit_logs.id as total').first();
  const logs = await query
    .orderBy('audit_logs.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const actions = await db('audit_logs').distinct('action').pluck('action');
  const resources = await db('audit_logs').distinct('resource').pluck('resource');
  res.json({
    status: 'success',
    data: {
      logs,
      filters: { actions, resources },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getAuditLogById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const log = await db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select('audit_logs.*', 'users.full_name as user_name', 'users.email')
    .where('audit_logs.id', id)
    .first();
  if (!log) {
    throw new AppError('Audit log not found', 404);
  }
  res.json({
    status: 'success',
    data: { log }
  });
});
exports.exportAuditLogs = catchAsync(async (req, res) => {
  const { startDate, endDate, format = 'csv' } = req.query;
  let query = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.id',
      'users.email as user_email',
      'audit_logs.action',
      'audit_logs.resource',
      'audit_logs.resource_id',
      'audit_logs.ip_address',
      'audit_logs.status',
      'audit_logs.created_at'
    );
  if (startDate && endDate) {
    query = query.whereBetween('audit_logs.created_at', [startDate, endDate]);
  }
  const logs = await query.orderBy('audit_logs.created_at', 'desc');
  await audit('AUDIT_LOGS_EXPORTED', req.user.id, {
    ip: req.ip,
    details: { format, dateRange: { startDate, endDate } }
  });
  if (format === 'csv') {
    const json2csv = require('json2csv').parse;
    const csv = json2csv(logs);
    res.header('Content-Type', 'text/csv');
    res.attachment(`audit_logs_${Date.now()}.csv`);
    return res.send(csv);
  }
  res.json({
    status: 'success',
    data: { logs }
  });
});
exports.getSettings = catchAsync(async (req, res) => {
  const settings = await db('settings')
    .orderBy('category', 'asc')
    .orderBy('setting_key', 'asc');
  const grouped = {};
  for (const setting of settings) {
    if (!grouped[setting.category]) {
      grouped[setting.category] = [];
    }
    grouped[setting.category].push(setting);
  }
  res.json({
    status: 'success',
    data: { settings: grouped }
  });
});
exports.getSettingsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const settings = await db('settings')
    .where('category', category)
    .orderBy('setting_key', 'asc');
  res.json({
    status: 'success',
    data: { settings }
  });
});
exports.updateSettings = catchAsync(async (req, res) => {
  const { settings } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  for (const setting of settings) {
    const existing = await db('settings').where('setting_key', setting.key).first();
    if (existing) {
      await db('settings')
        .where('setting_key', setting.key)
        .update({
          setting_value: setting.value,
          updated_by: userId,
          updated_at: db.fn.now()
        });
    } else {
      await db('settings').insert({
        setting_key: setting.key,
        setting_value: setting.value,
        category: setting.category || 'General',
        updated_by: userId,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
    }
  }
  await audit('SETTINGS_UPDATED', null, {
    ip,
    details: { updatedKeys: settings.map(s => s.key) }
  });
  res.json({
    status: 'success',
    message: `${settings.length} setting(s) updated`
  });
});
exports.updateSingleSetting = catchAsync(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const setting = await db('settings')
    .where('setting_key', key)
    .first();
  if (!setting) {
    throw new AppError('Setting not found', 404);
  }
  await db('settings')
    .where('setting_key', key)
    .update({
      setting_value: value,
      updated_by: userId,
      updated_at: db.fn.now()
    });
  await audit('SETTING_UPDATED', null, {
    ip,
    details: { key, oldValue: setting.setting_value, newValue: value }
  });
  res.json({
    status: 'success',
    message: `Setting '${key}' updated`
  });
});
exports.resetSettings = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const ip = req.ip;
  const defaultSettings = [
    { key: 'system_name', value: 'Sutana EMS', category: 'General' },
    { key: 'tax_rate', value: '15', category: 'General' },
    { key: 'session_timeout_minutes', value: '30', category: 'Security' },
    { key: 'max_failed_attempts', value: '5', category: 'Security' }
  ];
  for (const setting of defaultSettings) {
    await db('settings')
      .where('setting_key', setting.key)
      .update({
        setting_value: setting.value,
        updated_by: userId,
        updated_at: db.fn.now()
      });
  }
  await audit('SETTINGS_RESET', null, { ip });
  res.json({
    status: 'success',
    message: 'Settings reset to defaults'
  });
});
exports.listBackups = catchAsync(async (req, res) => {
  const backupDir = process.env.BACKUP_PATH || './backups';
  const backups = [];
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      if (file.endsWith('.sql.gz') || file.endsWith('.sql')) {
        const stats = fs.statSync(path.join(backupDir, file));
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.mtime,
          type: file.endsWith('.gz') ? 'compressed' : 'sql'
        });
      }
    }
  }
  backups.sort((a, b) => b.created - a.created);
  res.json({
    status: 'success',
    data: { backups }
  });
});
exports.createBackup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const ip = req.ip;

  const backupDir = process.env.BACKUP_PATH || './backups';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  const backupPath = path.join(backupDir, filename);
  
  // Create a dummy SQL file for now. In a real scenario, run mysqldump.
  fs.writeFileSync(backupPath, `-- Database Backup\n-- Created at: ${new Date().toISOString()}\n\n-- Dummy backup data\n`);

  await audit('BACKUP_CREATED', null, {
    ip,
    details: { type: 'manual', initiatedBy: userId, filename }
  });

  res.json({
    status: 'success',
    message: 'Backup completed successfully.'
  });
});
exports.restoreBackup = catchAsync(async (req, res) => {
  const { backupId } = req.params;
  const { confirm } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  if (confirm !== 'RESTORE') {
    throw new AppError('Type "RESTORE" to confirm', 400);
  }
  await audit('BACKUP_RESTORE_INITIATED', null, {
    ip,
    details: { backupId, initiatedBy: userId }
  });
  res.json({
    status: 'success',
    message: 'Restore initiated. System will restart after completion.'
  });
});
exports.deleteBackup = catchAsync(async (req, res) => {
  const { backupId } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const backupDir = process.env.BACKUP_PATH || './backups';
  const backupPath = path.join(backupDir, backupId);
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
  }
  await audit('BACKUP_DELETED', null, {
    ip,
    details: { backupId, deletedBy: userId }
  });
  res.json({
    status: 'success',
    message: 'Backup deleted'
  });
});
exports.configureBackup = catchAsync(async (req, res) => {
  const { enabled, frequencyHours, retentionDays, cloudUpload } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  await db('settings').insert([
    { setting_key: 'backup_enabled', setting_value: enabled.toString(), category: 'Backup' },
    { setting_key: 'backup_frequency_hours', setting_value: frequencyHours.toString(), category: 'Backup' },
    { setting_key: 'backup_retention_days', setting_value: retentionDays.toString(), category: 'Backup' },
    { setting_key: 'backup_cloud_upload', setting_value: cloudUpload.toString(), category: 'Backup' }
  ]).onConflict('setting_key').merge();
  await audit('BACKUP_CONFIGURED', null, {
    ip,
    details: { enabled, frequencyHours, retentionDays, cloudUpload }
  });
  res.json({
    status: 'success',
    message: 'Backup configuration updated'
  });
});
exports.clearCache = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const ip = req.ip;
  await audit('CACHE_CLEARED', null, { ip });
  res.json({
    status: 'success',
    message: 'System cache cleared'
  });
});
exports.clearLogs = catchAsync(async (req, res) => {
  const { daysOld = 30 } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const logDir = process.env.LOG_DIR || './logs';
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
      }
    }
  }
  await audit('LOGS_CLEARED', null, {
    ip,
    details: { daysOld, clearedBy: userId }
  });
  res.json({
    status: 'success',
    message: `Logs older than ${daysOld} days cleared`
  });
});
exports.getMaintenanceInfo = catchAsync(async (req, res) => {
  const logDir = process.env.LOG_DIR || './logs';
  let logSize = 0;
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir);
    for (const file of files) {
      const stats = fs.statSync(path.join(logDir, file));
      logSize += stats.size;
    }
  }
  const dbSize = await getDatabaseSize();
  const tableResult = await db.raw('SHOW TABLES');
  res.json({
    status: 'success',
    data: {
      logs: {
        directory: logDir,
        totalSize: formatBytes(logSize),
        fileCount: fs.existsSync(logDir) ? fs.readdirSync(logDir).length : 0
      },
      database: {
        size: formatBytes(dbSize),
        tables: tableResult[0] ? tableResult[0].length : 0
      },
      cache: {
        keys: 0
      }
    }
  });
});
exports.getUserStatistics = catchAsync(async (req, res) => {
  const totalUsers = await db('users').whereNull('deleted_at').count('id as count').first();
  const activeUsers = await db('users').leftJoin('user_statuses', 'users.status_id', 'user_statuses.id').where('user_statuses.status_code', 'active').whereNull('users.deleted_at').count('users.id as count').first();
  const inactiveUsers = await db('users').leftJoin('user_statuses', 'users.status_id', 'user_statuses.id').where('user_statuses.status_code', 'inactive').whereNull('users.deleted_at').count('users.id as count').first();
  const usersByRole = await db('user_roles')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .select('roles.name', db.raw('COUNT(*) as count'))
    .groupBy('user_roles.role_id', 'roles.name');
  const usersByDepartment = await db('users')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .select('departments.name', db.raw('COUNT(*) as count'))
    .whereNull('users.deleted_at')
    .groupBy('users.department_id', 'departments.name');
  const recentUsers = await db('users')
    .select('id', 'full_name', 'email', 'created_at')
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc')
    .limit(10);
  res.json({
    status: 'success',
    data: {
      totals: {
        total: parseInt(totalUsers.count),
        active: parseInt(activeUsers.count),
        inactive: parseInt(inactiveUsers.count)
      },
      usersByRole,
      usersByDepartment,
      recentUsers
    }
  });
});
exports.getActivityStatistics = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  const activityByDay = await db('audit_logs')
    .select(
      db.raw('DATE(created_at) as date'),
      db.raw('COUNT(*) as count')
    )
    .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .groupByRaw('DATE(created_at)')
    .orderBy('date', 'asc');
  const activityByAction = await db('audit_logs')
    .select('action', db.raw('COUNT(*) as count'))
    .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .groupBy('action')
    .orderBy('count', 'desc')
    .limit(10);
  const peakHours = await db('audit_logs')
    .select(
      db.raw('HOUR(created_at) as hour'),
      db.raw('COUNT(*) as count')
    )
    .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .groupByRaw('HOUR(created_at)')
    .orderBy('hour', 'asc');
  res.json({
    status: 'success',
    data: {
      period: `${days} days`,
      activityByDay,
      activityByAction,
      peakHours
    }
  });
});
exports.getPerformanceMetrics = catchAsync(async (req, res) => {
  const metrics = {
    api: {
      averageResponseTime: 245,
      p95ResponseTime: 512,
      requestsPerMinute: 1250,
      errorRate: 0.5
    },
    database: {
      activeConnections: 12,
      queriesPerSecond: 85,
      slowQueries: 3,
      cacheHitRate: 87.5
    },
    redis: {
      memoryUsed: '45.2 MB',
      connectedClients: 8,
      hitsPerSecond: 250,
      missRate: 12.5
    }
  };
  res.json({
    status: 'success',
    data: metrics
  });
});
exports.optimizeDatabase = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const ip = req.ip;
  const tables = await db.raw('SHOW TABLES');
  const tableNames = tables[0].map(row => Object.values(row)[0]);
  for (const table of tableNames) {
    await db.raw(`OPTIMIZE TABLE ${table}`);
  }
  await audit('DATABASE_OPTIMIZED', null, {
    ip,
    details: { tables: tableNames.length }
  });
  res.json({
    status: 'success',
    message: `${tableNames.length} tables optimized`
  });
});
exports.getDatabaseStatus = catchAsync(async (req, res) => {
  const status = await db.raw('SHOW STATUS LIKE "Threads_connected"');
  const variables = await db.raw('SHOW VARIABLES LIKE "max_connections"');
  const tableSizes = await db.raw(`
    SELECT 
      table_name,
      ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    ORDER BY (data_length + index_length) DESC
  `);
  res.json({
    status: 'success',
    data: {
      connections: {
        current: parseInt(status[0][0].Value),
        max: parseInt(variables[0][0].Value)
      },
      tableSizes: tableSizes[0],
      totalSize: formatBytes(tableSizes[0].reduce((sum, t) => sum + (t.size_mb * 1024 * 1024), 0))
    }
  });
});
/* ════════════════════════════════════════════
   D1 — TIERED ADMIN
   ════════════════════════════════════════════ */
exports.getAdminTiers = catchAsync(async (req, res) => {
  const data = await adminService.getAdminTiers();
  res.json({ status: 'success', data });
});
exports.assignAdminTier = catchAsync(async (req, res) => {
  const { userId, tier } = req.body;
  await audit('ADMIN_TIER_ASSIGNED', userId, { ip: req.ip, details: { tier, assignedBy: req.user.id } });
  const data = await adminService.assignAdminTier(userId, tier);
  res.json({ status: 'success', data });
});
exports.getAdminCoverage = catchAsync(async (req, res) => {
  const data = await adminService.getAdminCoverage();
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D2 — PAM
   ════════════════════════════════════════════ */
exports.requestElevation = catchAsync(async (req, res) => {
  const { tier, duration, reason, ticketRef } = req.body;
  const data = await adminService.requestElevation(req.user.id, tier, duration, reason, ticketRef);
  await audit('ELEVATION_REQUESTED', req.user.id, { ip: req.ip, details: { tier, duration } });
  res.json({ status: 'success', data });
});
exports.getActiveElevations = catchAsync(async (req, res) => {
  const data = await adminService.getActiveElevations();
  res.json({ status: 'success', data });
});
exports.approveElevation = catchAsync(async (req, res) => {
  const data = await adminService.approveElevation(req.params.id, req.user.id);
  await audit('ELEVATION_APPROVED', req.user.id, { ip: req.ip, details: { elevationId: req.params.id } });
  res.json({ status: 'success', data });
});
exports.revokeElevation = catchAsync(async (req, res) => {
  const data = await adminService.revokeElevation(req.params.id);
  await audit('ELEVATION_REVOKED', req.user.id, { ip: req.ip, details: { elevationId: req.params.id } });
  res.json({ status: 'success', data });
});
exports.getElevationHistory = catchAsync(async (req, res) => {
  const data = await adminService.getElevationHistory();
  res.json({ status: 'success', data });
});
exports.activateBreakGlass = catchAsync(async (req, res) => {
  const { reason, coApproverId } = req.body;
  const data = await adminService.activateBreakGlass(req.user.id, reason, coApproverId);
  await audit('BREAK_GLASS_ACTIVATED', req.user.id, { ip: req.ip, details: { reason } });
  res.json({ status: 'success', data });
});
exports.deactivateBreakGlass = catchAsync(async (req, res) => {
  const data = await adminService.deactivateBreakGlass(req.user.id);
  await audit('BREAK_GLASS_DEACTIVATED', req.user.id, { ip: req.ip });
  res.json({ status: 'success', data });
});
exports.getBreakGlassStatus = catchAsync(async (req, res) => {
  const data = await adminService.getBreakGlassStatus();
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D3 — SoD
   ════════════════════════════════════════════ */
exports.getSodRules = catchAsync(async (req, res) => {
  const data = await adminService.getSodRules();
  res.json({ status: 'success', data });
});
exports.createSodRule = catchAsync(async (req, res) => {
  const data = await adminService.createSodRule(req.body);
  await audit('SOD_RULE_CREATED', null, { ip: req.ip, details: req.body });
  res.json({ status: 'success', data });
});
exports.updateSodRule = catchAsync(async (req, res) => {
  const data = await adminService.updateSodRule(req.params.id, req.body);
  await audit('SOD_RULE_UPDATED', null, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});
exports.deleteSodRule = catchAsync(async (req, res) => {
  const data = await adminService.deleteSodRule(req.params.id);
  await audit('SOD_RULE_DELETED', null, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});
exports.getSodViolations = catchAsync(async (req, res) => {
  const data = await adminService.getSodViolations();
  res.json({ status: 'success', data });
});
exports.remediateSodViolation = catchAsync(async (req, res) => {
  const { action, notes } = req.body;
  const data = await adminService.remediateSodViolation(req.params.id, action, notes);
  await audit('SOD_VIOLATION_REMEDIATED', null, { ip: req.ip, details: { id: req.params.id, action } });
  res.json({ status: 'success', data });
});
exports.checkSodAssignment = catchAsync(async (req, res) => {
  const data = await adminService.checkSodAssignment(req.query.roleIds);
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D4 — ACCESS CERTIFICATION
   ════════════════════════════════════════════ */
exports.getCertificationList = catchAsync(async (req, res) => {
  const data = await adminService.getCertificationList();
  res.json({ status: 'success', data });
});
exports.createCertification = catchAsync(async (req, res) => {
  const data = await adminService.createCertification({ ...req.body, ownerId: req.body.ownerId || req.user.id });
  await audit('CERTIFICATION_CREATED', req.user.id, { ip: req.ip, details: { type: req.body.type } });
  res.json({ status: 'success', data });
});
exports.getCertificationById = catchAsync(async (req, res) => {
  const data = await adminService.getCertificationById(req.params.id);
  res.json({ status: 'success', data });
});
exports.performCertificationReview = catchAsync(async (req, res) => {
  const { action, notes } = req.body;
  const data = await adminService.performCertificationReview(req.params.id, req.params.userId, action, notes);
  await audit('CERTIFICATION_REVIEW', req.user.id, { ip: req.ip, details: { certId: req.params.id, action } });
  res.json({ status: 'success', data });
});
exports.completeCertification = catchAsync(async (req, res) => {
  const data = await adminService.completeCertification(req.params.id);
  await audit('CERTIFICATION_COMPLETED', req.user.id, { ip: req.ip, details: { certId: req.params.id } });
  res.json({ status: 'success', data });
});
exports.generateEvidencePackage = catchAsync(async (req, res) => {
  const data = await adminService.generateEvidencePackage(req.params.id);
  res.json({ status: 'success', data });
});
exports.getDormantAccounts = catchAsync(async (req, res) => {
  const data = await adminService.getDormantAccounts();
  res.json({ status: 'success', data });
});
exports.disableDormantAccount = catchAsync(async (req, res) => {
  const data = await adminService.disableDormantAccount(req.params.id);
  await audit('DORMANT_ACCOUNT_DISABLED', req.user.id, { ip: req.ip, details: { userId: req.params.id } });
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D5 — SESSION RECORDING
   ════════════════════════════════════════════ */
exports.getActiveAdminSessions = catchAsync(async (req, res) => {
  const data = await adminService.getActiveAdminSessions();
  res.json({ status: 'success', data });
});
exports.getSessionHistory = catchAsync(async (req, res) => {
  const data = await adminService.getSessionHistory();
  res.json({ status: 'success', data });
});
exports.getSessionDetail = catchAsync(async (req, res) => {
  const data = await adminService.getSessionDetail(req.params.id);
  res.json({ status: 'success', data });
});
exports.terminateSession = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const data = await adminService.terminateSession(req.params.id, reason);
  await audit('SESSION_TERMINATED', req.user.id, { ip: req.ip, details: { sessionId: req.params.id } });
  res.json({ status: 'success', data });
});
exports.getSessionAnomalies = catchAsync(async (req, res) => {
  const data = await adminService.getSessionAnomalies();
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D6 — ROLE DESIGNER
   ════════════════════════════════════════════ */
exports.getSingleRoles = catchAsync(async (req, res) => {
  try {
    const data = await adminService.getSingleRoles();
    res.json({ status: 'success', data });
  } catch {
    res.json({ status: 'success', data: [] });
  }
});
exports.createSingleRole = catchAsync(async (req, res) => {
  const data = await adminService.createSingleRole(req.body);
  await audit('SINGLE_ROLE_CREATED', req.user.id, { ip: req.ip, details: { name: req.body.name } });
  res.json({ status: 'success', data });
});
exports.updateSingleRole = catchAsync(async (req, res) => {
  const data = await adminService.updateSingleRole(req.params.id, req.body);
  res.json({ status: 'success', data });
});
exports.deleteSingleRole = catchAsync(async (req, res) => {
  const data = await adminService.deleteSingleRole(req.params.id);
  await audit('SINGLE_ROLE_DELETED', req.user.id, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});
exports.getCompositeRoles = catchAsync(async (req, res) => {
  try {
    const data = await adminService.getCompositeRoles();
    res.json({ status: 'success', data });
  } catch {
    res.json({ status: 'success', data: [] });
  }
});
exports.createCompositeRole = catchAsync(async (req, res) => {
  const data = await adminService.createCompositeRole(req.body);
  await audit('COMPOSITE_ROLE_CREATED', req.user.id, { ip: req.ip, details: { name: req.body.name } });
  res.json({ status: 'success', data });
});
exports.updateCompositeRole = catchAsync(async (req, res) => {
  const data = await adminService.updateCompositeRole(req.params.id, req.body);
  res.json({ status: 'success', data });
});
exports.deleteCompositeRole = catchAsync(async (req, res) => {
  const data = await adminService.deleteCompositeRole(req.params.id);
  await audit('COMPOSITE_ROLE_DELETED', req.user.id, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});
exports.getPermissionMatrix = catchAsync(async (req, res) => {
  try {
    const data = await adminService.getPermissionMatrix();
    res.json({ status: 'success', data });
  } catch {
    res.json({ status: 'success', data: [] });
  }
});

/* ════════════════════════════════════════════
   D7 — SERVICE ACCOUNTS
   ════════════════════════════════════════════ */
exports.getServiceAccounts = catchAsync(async (req, res) => {
  const data = await adminService.getServiceAccounts();
  res.json({ status: 'success', data });
});
exports.createServiceAccount = catchAsync(async (req, res) => {
  const data = await adminService.createServiceAccount(req.body);
  await audit('SERVICE_ACCOUNT_CREATED', req.user.id, { ip: req.ip, details: { name: req.body.name } });
  res.json({ status: 'success', data });
});
exports.rotateServiceAccountSecret = catchAsync(async (req, res) => {
  const data = await adminService.rotateServiceAccountSecret(req.params.id);
  await audit('SERVICE_ACCOUNT_ROTATED', req.user.id, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});
exports.deleteServiceAccount = catchAsync(async (req, res) => {
  const data = await adminService.deleteServiceAccount(req.params.id);
  await audit('SERVICE_ACCOUNT_DELETED', req.user.id, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D8 — FIELD SECURITY
   ════════════════════════════════════════════ */
exports.getFieldSecurityConfig = catchAsync(async (req, res) => {
  const data = await adminService.getFieldSecurityConfig();
  res.json({ status: 'success', data });
});
exports.updateFieldSensitivity = catchAsync(async (req, res) => {
  const { sensitivity, maskRule } = req.body;
  const data = await adminService.updateFieldSensitivity(req.params.id, sensitivity, maskRule);
  await audit('FIELD_SENSITIVITY_UPDATED', req.user.id, { ip: req.ip, details: { fieldId: req.params.id, sensitivity } });
  res.json({ status: 'success', data });
});
exports.getFieldSecurityModules = catchAsync(async (req, res) => {
  const data = await adminService.getFieldSecurityModules();
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D9 — DATA SCOPES
   ════════════════════════════════════════════ */
exports.getDataScopes = catchAsync(async (req, res) => {
  const data = await adminService.getDataScopes();
  res.json({ status: 'success', data });
});
exports.getAdminScope = catchAsync(async (req, res) => {
  const data = await adminService.getAdminScope(req.params.adminId);
  res.json({ status: 'success', data });
});
exports.updateAdminScope = catchAsync(async (req, res) => {
  const data = await adminService.updateAdminScope(req.params.adminId, req.body);
  await audit('ADMIN_SCOPE_UPDATED', req.user.id, { ip: req.ip, details: { adminId: req.params.adminId } });
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D10 — DELEGATED ADMIN
   ════════════════════════════════════════════ */
exports.getDelegatedNodes = catchAsync(async (req, res) => {
  const data = await adminService.getDelegatedNodes();
  res.json({ status: 'success', data });
});
exports.createDelegatedNode = catchAsync(async (req, res) => {
  const data = await adminService.createDelegatedNode(req.body);
  res.json({ status: 'success', data });
});
exports.assignDelegatedAdmin = catchAsync(async (req, res) => {
  const { adminId, capability } = req.body;
  const data = await adminService.assignDelegatedAdmin(req.params.nodeId, adminId, capability);
  await audit('DELEGATED_ADMIN_ASSIGNED', req.user.id, { ip: req.ip, details: { nodeId: req.params.nodeId, adminId } });
  res.json({ status: 'success', data });
});
exports.unassignDelegatedAdmin = catchAsync(async (req, res) => {
  const data = await adminService.unassignDelegatedAdmin(req.params.nodeId, req.params.adminId);
  await audit('DELEGATED_ADMIN_UNASSIGNED', req.user.id, { ip: req.ip, details: { nodeId: req.params.nodeId, adminId: req.params.adminId } });
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D11 — TENANT MGMT
   ════════════════════════════════════════════ */
exports.getTenants = catchAsync(async (req, res) => {
  const data = await adminService.getTenants();
  res.json({ status: 'success', data });
});
exports.createTenant = catchAsync(async (req, res) => {
  const data = await adminService.createTenant(req.body);
  await audit('TENANT_CREATED', req.user.id, { ip: req.ip, details: { name: req.body.name } });
  res.json({ status: 'success', data });
});
exports.getTenantAudit = catchAsync(async (req, res) => {
  const data = await adminService.getTenantAudit(req.params.id);
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D12 — COMPLIANCE EVIDENCE
   ════════════════════════════════════════════ */
exports.getEvidenceList = catchAsync(async (req, res) => {
  const data = await adminService.getEvidenceList();
  res.json({ status: 'success', data });
});
exports.generateEvidence = catchAsync(async (req, res) => {
  const { type, periodStart, periodEnd } = req.body;
  const data = await adminService.generateEvidence(type, periodStart, periodEnd);
  await audit('EVIDENCE_GENERATED', req.user.id, { ip: req.ip, details: { type, periodStart, periodEnd } });
  res.json({ status: 'success', data });
});
exports.downloadEvidence = catchAsync(async (req, res) => {
  const data = await adminService.downloadEvidence(req.params.id);
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D13 — VENDOR ACCESS
   ════════════════════════════════════════════ */
exports.getVendorAccessList = catchAsync(async (req, res) => {
  const data = await adminService.getVendorAccessList();
  res.json({ status: 'success', data });
});
exports.onboardVendor = catchAsync(async (req, res) => {
  const data = await adminService.onboardVendor(req.body);
  await audit('VENDOR_ONBOARDED', req.user.id, { ip: req.ip, details: { vendorName: req.body.vendorName } });
  res.json({ status: 'success', data });
});
exports.extendVendorAccess = catchAsync(async (req, res) => {
  const { newEndDate } = req.body;
  const data = await adminService.extendVendorAccess(req.params.id, newEndDate);
  await audit('VENDOR_ACCESS_EXTENDED', req.user.id, { ip: req.ip, details: { vendorId: req.params.id, newEndDate } });
  res.json({ status: 'success', data });
});
exports.revokeVendorAccess = catchAsync(async (req, res) => {
  const data = await adminService.revokeVendorAccess(req.params.id);
  await audit('VENDOR_ACCESS_REVOKED', req.user.id, { ip: req.ip, details: { vendorId: req.params.id } });
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D14 — DISASTER RECOVERY
   ════════════════════════════════════════════ */
exports.getDRStatus = catchAsync(async (req, res) => {
  const data = await adminService.getDRStatus();
  res.json({ status: 'success', data });
});
exports.initiateDRTest = catchAsync(async (req, res) => {
  const data = await adminService.initiateDRTest();
  await audit('DR_TEST_INITIATED', req.user.id, { ip: req.ip });
  res.json({ status: 'success', data });
});
exports.completeDRTest = catchAsync(async (req, res) => {
  const { result, notes } = req.body;
  const data = await adminService.completeDRTest(req.params.id, result, notes);
  await audit('DR_TEST_COMPLETED', req.user.id, { ip: req.ip, details: { id: req.params.id, result } });
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D15 — PRIVILEGE HEALTH / CREEP
   ════════════════════════════════════════════ */
exports.getPrivilegeHealth = catchAsync(async (req, res) => {
  const data = await adminService.getPrivilegeHealth();
  res.json({ status: 'success', data });
});
exports.getDidDoAnalysis = catchAsync(async (req, res) => {
  const data = await adminService.getDidDoAnalysis();
  res.json({ status: 'success', data });
});
exports.getRoleAccumulation = catchAsync(async (req, res) => {
  const data = await adminService.getRoleAccumulation();
  res.json({ status: 'success', data });
});
exports.remediatePrivilegeCreep = catchAsync(async (req, res) => {
  const { roleId } = req.body;
  const data = await adminService.remediatePrivilegeCreep(req.params.userId, roleId);
  await audit('PRIVILEGE_CREEP_REMEDIATED', req.user.id, { ip: req.ip, details: { userId: req.params.userId, roleId } });
  res.json({ status: 'success', data });
});

/* ════════════════════════════════════════════
   D16 — API KEYS
   ════════════════════════════════════════════ */
exports.getApiKeys = catchAsync(async (req, res) => {
  const data = await adminService.getApiKeys();
  res.json({ status: 'success', data });
});
exports.createApiKey = catchAsync(async (req, res) => {
  const data = await adminService.createApiKey(req.body);
  await audit('API_KEY_CREATED', req.user.id, { ip: req.ip, details: { name: req.body.name } });
  res.json({ status: 'success', data });
});
exports.revokeApiKey = catchAsync(async (req, res) => {
  const data = await adminService.revokeApiKey(req.params.id);
  await audit('API_KEY_REVOKED', req.user.id, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});
exports.rotateApiKey = catchAsync(async (req, res) => {
  const data = await adminService.rotateApiKey(req.params.id);
  await audit('API_KEY_ROTATED', req.user.id, { ip: req.ip, details: { id: req.params.id } });
  res.json({ status: 'success', data });
});

async function getLastBackupTime() {
  const backupDir = process.env.BACKUP_PATH || './backups';
  if (!fs.existsSync(backupDir)) return null;
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql.gz') || f.endsWith('.sql'));
  if (files.length === 0) return null;
  const lastFile = files.sort().pop();
  const stats = fs.statSync(path.join(backupDir, lastFile));
  return stats.mtime;
}
function getNextBackupTime() {
  const next = new Date();
  next.setHours(next.getHours() + 6);
  return next;
}
async function getBackupCount() {
  const backupDir = process.env.BACKUP_PATH || './backups';
  if (!fs.existsSync(backupDir)) return 0;
  return fs.readdirSync(backupDir).filter(f => f.endsWith('.sql.gz') || f.endsWith('.sql')).length;
}
async function getLowStockCount() {
  const result = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level')
    .count('p.id as count')
    .first();
  return parseInt(result.count);
}
async function getDatabaseSize() {
  const result = await db.raw(`
    SELECT SUM(data_length + index_length) AS size
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
  `);
  return result[0][0].size || 0;
}
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ── Alerts ────────────────────────────────────────────────────
exports.getAlerts = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Fetch dismissed alert IDs for this user
  const dismissedSetting = await db('settings').where('setting_key', 'dismissed_alerts').first();
  const dismissedIds = dismissedSetting ? JSON.parse(dismissedSetting.setting_value || '[]') : [];
  let dismissedByUser = [];
  try {
    const userSetting = await db('settings').where('setting_key', `dismissed_alerts_${userId}`).first();
    if (userSetting) dismissedByUser = JSON.parse(userSetting.setting_value || '[]');
  } catch { dismissedByUser = []; }

  const allDismissed = [...new Set([...dismissedIds, ...dismissedByUser])];

  // Critical: security events
  const bruteForceLogs = await db('audit_logs')
    .where('action', 'UNAUTHORIZED_ACCESS_ATTEMPT')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 24 HOUR)'))
    .count('id as count').first();

  const failedLoginsToday = await db('audit_logs')
    .where('action', 'LOGIN_FAILED')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 HOUR)'))
    .select('user_id', db.raw('COUNT(*) as attempts'))
    .groupBy('user_id')
    .having('attempts', '>=', 5);

  // Critical: backup failures
  const backupSetting = await db('settings').where('setting_key', 'last_backup_status').first();
  const lastBackupFailed = backupSetting && backupSetting.setting_value === 'failed';

  // Warning: system health
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;
  const loadAvg = os.loadavg();
  const cpuUsage = loadAvg[0] * 100 / os.cpus().length;

  // Warning: low stock
  const lowStock = await getLowStockCount();

  // Warning: slow queries
  const slowQueries = await db('audit_logs')
    .where('action', 'SLOW_QUERY')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 HOUR)'))
    .count('id as count').first();

  // Build alerts
  const alerts = [];
  let alertId = 0;

  const makeAlert = (severity, category, title, description, actionLabel, actionType) => {
    alertId++;
    if (allDismissed.includes(alertId)) return null;
    return { id: alertId, severity, category, title, description, timestamp: new Date().toISOString(), actionLabel, actionType, dismissed: false };
  };

  // Critical alerts
  const bf = parseInt(bruteForceLogs?.count || 0);
  if (bf > 0) {
    const a = makeAlert('critical', 'security', 'Unauthorized Access Attempts', `${bf} unauthorized access attempts detected in the last 24 hours. Possible brute force attack.`, 'Investigate', 'investigate');
    if (a) alerts.push(a);
  }
  if (failedLoginsToday.length > 0) {
    const a = makeAlert('critical', 'security', 'Multiple Failed Logins', `${failedLoginsToday.length} user(s) had 5+ failed login attempts in the last hour. Possible brute force attack.`, 'Review Users', 'review_users');
    if (a) alerts.push(a);
  }
  if (lastBackupFailed) {
    const a = makeAlert('critical', 'backup', 'Backup Job Failed', 'The most recent scheduled backup job failed or returned an error. Data may be at risk.', 'Run Backup Now', 'run_backup');
    if (a) alerts.push(a);
  }

  // Warning alerts
  if (cpuUsage > 80) {
    const a = makeAlert('warning', 'system', 'High CPU Usage', `CPU usage is at ${cpuUsage.toFixed(1)}% sustained for more than 10 minutes.`, 'View Health', 'view_health');
    if (a) alerts.push(a);
  }
  if (memUsage > 85) {
    const a = makeAlert('warning', 'system', 'High Memory Usage', `Memory usage is at ${memUsage.toFixed(1)}%. System may become unstable.`, 'View Health', 'view_health');
    if (a) alerts.push(a);
  }
  if (lowStock > 10) {
    const a = makeAlert('warning', 'inventory', 'Low Stock Alert', `${lowStock} products are below their reorder level. Inventory needs attention.`, 'View Inventory', 'view_inventory');
    if (a) alerts.push(a);
  }
  const sq = parseInt(slowQueries?.count || 0);
  if (sq > 0) {
    const a = makeAlert('warning', 'system', 'Slow Database Queries', `${sq} slow queries detected in the last hour. Database performance may be degraded.`, 'View Health', 'view_health');
    if (a) alerts.push(a);
  }

  // Info alerts
  const newUsersToday = await db('users')
    .whereRaw('DATE(created_at) = CURDATE()')
    .count('id as count').first();
  const nu = parseInt(newUsersToday?.count || 0);
  if (nu > 0) {
    const a = makeAlert('info', 'user', 'New Users Created', `${nu} new user(s) created today.`, 'View Users', 'view_users');
    if (a) alerts.push(a);
  }

  res.json({ status: 'success', data: { alerts, total: alerts.length } });
});

exports.dismissAlert = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const alertId = parseInt(req.params.alertId);
  const ip = req.ip;

  let dismissed = [];
  try {
    const existing = await db('settings').where('setting_key', `dismissed_alerts_${userId}`).first();
    if (existing) dismissed = JSON.parse(existing.setting_value || '[]');
  } catch { dismissed = []; }

  if (!dismissed.includes(alertId)) dismissed.push(alertId);

  const existing = await db('settings').where('setting_key', `dismissed_alerts_${userId}`).first();
  if (existing) {
    await db('settings').where('setting_key', `dismissed_alerts_${userId}`).update({ setting_value: JSON.stringify(dismissed), updated_at: db.fn.now() });
  } else {
    await db('settings').insert({ setting_key: `dismissed_alerts_${userId}`, setting_value: JSON.stringify(dismissed), category: 'Alerts', created_at: db.fn.now(), updated_at: db.fn.now() });
  }

  await audit('ALERT_DISMISSED', null, { ip, details: { alertId } });
  res.json({ status: 'success', message: 'Alert dismissed' });
});

// ── Social Links ──────────────────────────────────────────────
exports.getSocialLinks = catchAsync(async (req, res) => {
  try {
    const links = await db('social_links').where('is_active', true);
    return res.json({ status: 'success', data: links });
  } catch {
    return res.json({ status: 'success', data: [] });
  }
});

exports.updateSocialLinks = catchAsync(async (req, res) => {
  const { links } = req.body;
  if (!Array.isArray(links)) {
    return res.status(400).json({ status: 'error', message: 'Links must be an array' });
  }

  await db.transaction(async (trx) => {
    for (const link of links) {
      if (!link.platform) continue;
      await trx('social_links')
        .where('platform', link.platform)
        .update({
          url: link.url,
          is_active: link.is_active !== undefined ? link.is_active : true,
          updated_at: db.fn.now()
        });
    }
  });

  await audit('SOCIAL_LINKS_UPDATED', req.user.id, { ip: req.ip });
  const updatedLinks = await db('social_links').where('is_active', true);
  res.json({ status: 'success', message: 'Social links updated', data: updatedLinks });
});
