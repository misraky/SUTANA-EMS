const { db } = require('../config/database');

const getCrisisStatus = async () => {
  const status = await db('crisis_status').orderBy('created_at', 'desc').first();
  const activeActions = await db('crisis_actions').whereNot('status', 'completed').count('id as c').first();
  const pendingApprovals = await db('crisis_fast_track').where('status', 'pending').count('id as c').first();

  return {
    isActive: status ? status.is_active : false,
    activatedAt: status?.activated_at || null,
    activatedBy: status?.activated_by || null,
    reason: status?.reason || null,
    activeActions: parseInt(activeActions?.c || 0),
    pendingApprovals: parseInt(pendingApprovals?.c || 0)
  };
};

const activateCrisisMode = async (data) => {
  await db('crisis_status').update({
    is_active: true,
    activated_at: db.fn.now(),
    activated_by: data.activated_by || 'CEO',
    reason: data.reason || 'Crisis mode activated'
  });
  return getCrisisStatus();
};

const deactivateCrisisMode = async () => {
  await db('crisis_status').update({
    is_active: false,
    deactivated_at: db.fn.now()
  });
  return getCrisisStatus();
};

const getEmergencyActions = async () => {
  const actions = await db('crisis_actions').orderByRaw("FIELD(priority, 'critical', 'high', 'medium', 'low')").orderBy('created_at', 'desc');
  const total = await db('crisis_actions').count('id as c').first();
  const byStatus = await db('crisis_actions').select('status').count('id as count').groupBy('status');
  const byPriority = await db('crisis_actions').select('priority').count('id as count').groupBy('priority');

  return {
    totalActions: parseInt(total.c),
    byStatus: byStatus.map(s => ({ status: s.status, count: parseInt(s.count) })),
    byPriority: byPriority.map(p => ({ priority: p.priority, count: parseInt(p.count) })),
    actions
  };
};

const createEmergencyAction = async (data) => {
  const [id] = await db('crisis_actions').insert({
    title: data.title,
    description: data.description || null,
    priority: data.priority || 'high',
    status: data.status || 'pending',
    assigned_to: data.assigned_to || null,
    deadline: data.deadline || null
  });
  return db('crisis_actions').where('id', id).first();
};

const updateEmergencyAction = async (id, data) => {
  const allowed = ['title', 'description', 'priority', 'status', 'assigned_to', 'deadline'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('crisis_actions').where('id', id).update(update);
  return db('crisis_actions').where('id', id).first();
};

const deleteEmergencyAction = async (id) => {
  return db('crisis_actions').where('id', id).del();
};

const fastTrackApproval = async (data) => {
  const [id] = await db('crisis_fast_track').insert({
    request_title: data.request_title,
    description: data.description || null,
    amount: data.amount || null,
    requested_by: data.requested_by || null,
    status: 'pending'
  });
  return db('crisis_fast_track').where('id', id).first();
};

const getFastTrackApprovals = async () => {
  const items = await db('crisis_fast_track').orderBy('created_at', 'desc');
  const total = await db('crisis_fast_track').count('id as c').first();
  const pending = await db('crisis_fast_track').where('status', 'pending').count('id as c').first();
  const approved = await db('crisis_fast_track').where('status', 'approved').sum('amount as total').first();
  const byStatus = await db('crisis_fast_track').select('status').count('id as count').groupBy('status');

  return {
    totalRequests: parseInt(total.c),
    pendingRequests: parseInt(pending.c),
    totalApprovedAmount: Math.round(parseFloat(approved?.total || 0)),
    byStatus: byStatus.map(s => ({ status: s.status, count: parseInt(s.count) })),
    items
  };
};

const approveFastTrack = async (id, approvedBy) => {
  await db('crisis_fast_track').where('id', id).update({
    status: 'approved',
    approved_by: approvedBy || 'CEO',
    approved_at: db.fn.now()
  });
  return db('crisis_fast_track').where('id', id).first();
};

const rejectFastTrack = async (id) => {
  await db('crisis_fast_track').where('id', id).update({ status: 'rejected' });
  return db('crisis_fast_track').where('id', id).first();
};

module.exports = { getCrisisStatus, activateCrisisMode, deactivateCrisisMode, getEmergencyActions, createEmergencyAction, updateEmergencyAction, deleteEmergencyAction, fastTrackApproval, getFastTrackApprovals, approveFastTrack, rejectFastTrack };
