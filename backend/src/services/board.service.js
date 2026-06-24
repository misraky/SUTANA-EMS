const { db } = require('../config/database');

const getBoardMeetings = async () => {
  const meetings = await db('board_meetings').orderBy('meeting_date', 'desc');
  const upcoming = await db('board_meetings').where('meeting_date', '>=', new Date().toISOString().split('T')[0]).whereNot('status', 'cancelled').orderBy('meeting_date').limit(3);
  const total = await db('board_meetings').count('id as c').first();
  const completed = await db('board_meetings').where('status', 'completed').count('id as c').first();
  const scheduled = await db('board_meetings').where('status', 'scheduled').count('id as c').first();

  return {
    totalMeetings: parseInt(total.c),
    completedMeetings: parseInt(completed.c),
    scheduledMeetings: parseInt(scheduled.c),
    upcomingMeetings: upcoming,
    meetings
  };
};

const getBoardPack = async (meetingId) => {
  const meeting = await db('board_meetings').where('id', meetingId).first();
  const packs = await db('board_packs').where('meeting_id', meetingId).orderBy('created_at', 'desc');
  const resolutions = await db('board_resolutions').where('meeting_id', meetingId).orderBy('created_at', 'desc');

  if (!meeting) return null;

  return { meeting, packs, resolutions };
};

const getShareholderRegistry = async () => {
  const shareholders = await db('shareholders').orderBy('share_percentage', 'desc');
  const totalPercentage = await db('shareholders').where('status', 'active').sum('share_percentage as total').first();
  const totalShares = await db('shareholders').sum('shares_count as total').first();
  const active = await db('shareholders').where('status', 'active').count('id as c').first();
  const byType = await db('shareholders').select('share_type').count('id as count').groupBy('share_type');

  return {
    totalShareholders: await db('shareholders').count('id as c').then(r => parseInt(r[0].c)),
    activeShareholders: parseInt(active.c),
    totalActivePercentage: parseFloat(totalPercentage?.total || 0),
    totalSharesIssued: parseInt(totalShares?.total || 0),
    byType: byType.map(t => ({ type: t.share_type, count: parseInt(t.count) })),
    shareholders
  };
};

const getDividendStatus = async () => {
  const dividends = await db('dividends')
    .join('shareholders', 'dividends.shareholder_id', 'shareholders.id')
    .select('dividends.*', 'shareholders.name as shareholder_name', 'shareholders.share_percentage')
    .orderBy('dividends.period', 'desc')
    .orderBy('shareholders.share_percentage', 'desc');

  const totalDeclared = await db('dividends').sum('total_amount as total').first();
  const totalPaid = await db('dividends').where('status', 'paid').sum('total_amount as total').first();
  const pending = await db('dividends').where('status', 'declared').sum('total_amount as total').first();
  const lastPeriod = await db('dividends').orderBy('period', 'desc').select('period').first();

  const byPeriod = await db('dividends').select('period').sum('total_amount as total').avg('per_share as perShare').groupBy('period').orderBy('period', 'desc');

  return {
    totalDeclared: Math.round(parseFloat(totalDeclared?.total || 0)),
    totalPaid: Math.round(parseFloat(totalPaid?.total || 0)),
    pendingPayout: Math.round(parseFloat(pending?.total || 0)),
    lastPeriod: lastPeriod?.period || 'N/A',
    byPeriod: byPeriod.map(p => ({
      period: p.period,
      totalAmount: Math.round(parseFloat(p.total)),
      perShare: Math.round(parseFloat(p.perShare || 0))
    })),
    dividends
  };
};

const getBoardResolutions = async () => {
  const resolutions = await db('board_resolutions')
    .leftJoin('board_meetings', 'board_resolutions.meeting_id', 'board_meetings.id')
    .select('board_resolutions.*', 'board_meetings.title as meeting_title', 'board_meetings.meeting_date as meeting_date')
    .orderBy('board_resolutions.created_at', 'desc');

  const byStatus = await db('board_resolutions').select('status').count('id as count').groupBy('status');
  const total = await db('board_resolutions').count('id as c').first();
  const passed = await db('board_resolutions').whereIn('status', ['passed', 'implemented']).count('id as c').first();
  const proposed = await db('board_resolutions').where('status', 'proposed').count('id as c').first();

  return {
    total: parseInt(total.c),
    passed: parseInt(passed.c),
    proposed: parseInt(proposed.c),
    byStatus: byStatus.map(s => ({ status: s.status, count: parseInt(s.count) })),
    resolutions
  };
};

const createBoardMeeting = async (data) => {
  const [id] = await db('board_meetings').insert({
    title: data.title,
    meeting_date: data.meeting_date,
    meeting_time: data.meeting_time || null,
    venue: data.venue || null,
    agenda: data.agenda || null,
    status: 'scheduled'
  });
  return db('board_meetings').where('id', id).first();
};

const createShareholder = async (data) => {
  const [id] = await db('shareholders').insert({
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    share_percentage: data.share_percentage || 0,
    shares_count: data.shares_count || 0,
    share_type: data.share_type || 'ordinary',
    status: 'active',
    joined_date: data.joined_date || new Date().toISOString().split('T')[0]
  });
  return db('shareholders').where('id', id).first();
};

const createBoardResolution = async (data) => {
  const [id] = await db('board_resolutions').insert({
    title: data.title,
    description: data.description || null,
    meeting_id: data.meeting_id || null,
    resolution_date: data.resolution_date || null,
    status: 'proposed',
    proposed_by: data.proposed_by || null,
    outcome: data.outcome || null
  });
  return db('board_resolutions').where('id', id).first();
};

const updateBoardMeeting = async (id, data) => {
  const allowed = ['title', 'meeting_date', 'meeting_time', 'venue', 'agenda', 'status'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('board_meetings').where('id', id).update(update);
  return db('board_meetings').where('id', id).first();
};

const deleteBoardMeeting = async (id) => {
  await db('board_packs').where('meeting_id', id).del();
  await db('board_resolutions').where('meeting_id', id).del();
  return db('board_meetings').where('id', id).del();
};

const updateShareholder = async (id, data) => {
  const allowed = ['name', 'email', 'phone', 'share_percentage', 'shares_count', 'share_type', 'status'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('shareholders').where('id', id).update(update);
  return db('shareholders').where('id', id).first();
};

const deleteShareholder = async (id) => {
  await db('dividends').where('shareholder_id', id).del();
  return db('shareholders').where('id', id).del();
};

const updateBoardResolution = async (id, data) => {
  const allowed = ['title', 'description', 'meeting_id', 'resolution_date', 'status', 'proposed_by', 'outcome'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('board_resolutions').where('id', id).update(update);
  return db('board_resolutions').where('id', id).first();
};

const deleteBoardResolution = async (id) => {
  return db('board_resolutions').where('id', id).del();
};

module.exports = { getBoardMeetings, getBoardPack, getShareholderRegistry, getDividendStatus, getBoardResolutions, createBoardMeeting, createShareholder, createBoardResolution, updateBoardMeeting, deleteBoardMeeting, updateShareholder, deleteShareholder, updateBoardResolution, deleteBoardResolution };
