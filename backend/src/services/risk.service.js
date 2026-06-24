const { db } = require('../config/database');

const getRiskRegister = async () => {
  const risks = await db('risk_register').orderBy('risk_score', 'desc');
  const total = await db('risk_register').count('id as c').first();
  const byCategory = await db('risk_register').select('category').count('id as count').groupBy('category').orderBy('category');
  const byStatus = await db('risk_register').select('status').count('id as count').groupBy('status');
  const critical = risks.filter(r => r.risk_score >= 12).length;
  const avgScoreQuery = await db('risk_register').avg('risk_score as avg').first();

  return {
    totalRisks: parseInt(total.c),
    criticalRisks: critical,
    averageScore: parseFloat(parseFloat(avgScoreQuery?.avg || 0).toFixed(1)),
    byCategory: byCategory.map(c => ({ category: c.category, count: parseInt(c.count) })),
    byStatus: byStatus.map(s => ({ status: s.status, count: parseInt(s.count) })),
    risks
  };
};

const getComplianceStatus = async () => {
  const items = await db('compliance_status').orderBy('next_review_date');
  const total = await db('compliance_status').count('id as c').first();
  const byStatus = await db('compliance_status').select('status').count('id as count').groupBy('status');
  const compliant = await db('compliance_status').where('status', 'compliant').count('id as c').first();
  const nonCompliant = await db('compliance_status').where('status', 'non-compliant').count('id as c').first();

  return {
    totalItems: parseInt(total.c),
    compliantItems: parseInt(compliant.c),
    nonCompliantItems: parseInt(nonCompliant.c),
    complianceRate: parseInt(total.c) > 0 ? Math.round((parseInt(compliant.c) / parseInt(total.c)) * 100) : 0,
    byStatus: byStatus.map(s => ({ status: s.status, count: parseInt(s.count) })),
    items
  };
};

const getRegulatoryCalendar = async () => {
  const items = await db('regulatory_calendar').orderBy('deadline');
  const total = await db('regulatory_calendar').count('id as c').first();
  const upcoming = await db('regulatory_calendar').where('status', 'upcoming').count('id as c').first();
  const dueSoon = await db('regulatory_calendar').where('status', 'due-soon').count('id as c').first();
  const overdue = await db('regulatory_calendar').where('status', 'overdue').count('id as c').first();
  const completed = await db('regulatory_calendar').where('status', 'completed').count('id as c').first();

  return {
    totalItems: parseInt(total.c),
    upcomingItems: parseInt(upcoming.c),
    dueSoonItems: parseInt(dueSoon.c),
    overdueItems: parseInt(overdue.c),
    completedItems: parseInt(completed.c),
    items
  };
};

const getESGSummary = async () => {
  const metrics = await db('esg_metrics').orderBy('category').orderBy('metric_name');
  const byCategory = await db('esg_metrics').select('category').count('id as count').avg('current_value as avg').groupBy('category');

  const env = metrics.filter(m => m.category === 'Environmental');
  const social = metrics.filter(m => m.category === 'Social');
  const gov = metrics.filter(m => m.category === 'Governance');

  return {
    metrics,
    byCategory: byCategory.map(c => ({ category: c.category, count: parseInt(c.count), averageValue: parseFloat(parseFloat(c.avg || 0).toFixed(1)) })),
    environmental: env,
    social,
    governance: gov
  };
};

const getCybersecurityPosture = async () => {
  const controls = await db('cybersecurity_status').orderBy('category').orderBy('control_name');
  const total = await db('cybersecurity_status').count('id as c').first();
  const implemented = await db('cybersecurity_status').where('status', 'implemented').count('id as c').first();
  const inProgress = await db('cybersecurity_status').where('status', 'in-progress').count('id as c').first();
  const notStarted = await db('cybersecurity_status').where('status', 'not-started').count('id as c').first();
  const avgScore = await db('cybersecurity_status').avg('score as avg').first();
  const byCategory = await db('cybersecurity_status').select('category').avg('score as avgScore').count('id as count').groupBy('category');

  return {
    totalControls: parseInt(total.c),
    implementedControls: parseInt(implemented.c),
    inProgressControls: parseInt(inProgress.c),
    notStartedControls: parseInt(notStarted.c),
    overallScore: Math.round(parseFloat(avgScore?.avg || 0)),
    byCategory: byCategory.map(c => ({ category: c.category, averageScore: Math.round(parseFloat(c.avgScore || 0)), count: parseInt(c.count) })),
    controls
  };
};

const createRisk = async (data) => {
  const [id] = await db('risk_register').insert({
    title: data.title,
    description: data.description || null,
    category: data.category || null,
    likelihood: data.likelihood || 'possible',
    impact: data.impact || 'moderate',
    risk_score: data.risk_score || 0,
    status: data.status || 'identified',
    owner: data.owner || null,
    mitigation_strategy: data.mitigation_strategy || null
  });
  return db('risk_register').where('id', id).first();
};

const updateRisk = async (id, data) => {
  const allowed = ['title', 'description', 'category', 'likelihood', 'impact', 'risk_score', 'status', 'owner', 'mitigation_strategy'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  update.updated_at = db.fn.now();
  await db('risk_register').where('id', id).update(update);
  return db('risk_register').where('id', id).first();
};

const deleteRisk = async (id) => {
  return db('risk_register').where('id', id).del();
};

const createComplianceItem = async (data) => {
  const [id] = await db('compliance_status').insert({
    requirement: data.requirement,
    regulation: data.regulation || null,
    status: data.status || 'in-progress',
    last_review_date: data.last_review_date || null,
    next_review_date: data.next_review_date || null,
    responsible_owner: data.responsible_owner || null,
    notes: data.notes || null
  });
  return db('compliance_status').where('id', id).first();
};

const updateComplianceItem = async (id, data) => {
  const allowed = ['requirement', 'regulation', 'status', 'last_review_date', 'next_review_date', 'responsible_owner', 'notes'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('compliance_status').where('id', id).update(update);
  return db('compliance_status').where('id', id).first();
};

const deleteComplianceItem = async (id) => {
  return db('compliance_status').where('id', id).del();
};

const createRegulatoryItem = async (data) => {
  const [id] = await db('regulatory_calendar').insert({
    title: data.title,
    description: data.description || null,
    authority: data.authority || null,
    deadline: data.deadline,
    status: data.status || 'upcoming',
    owner: data.owner || null
  });
  return db('regulatory_calendar').where('id', id).first();
};

const updateRegulatoryItem = async (id, data) => {
  const allowed = ['title', 'description', 'authority', 'deadline', 'status', 'owner'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('regulatory_calendar').where('id', id).update(update);
  return db('regulatory_calendar').where('id', id).first();
};

const deleteRegulatoryItem = async (id) => {
  return db('regulatory_calendar').where('id', id).del();
};

const createESGMetric = async (data) => {
  const [id] = await db('esg_metrics').insert({
    category: data.category,
    metric_name: data.metric_name,
    current_value: data.current_value || 0,
    target_value: data.target_value || 0,
    unit: data.unit || null,
    period: data.period || null,
    trend: data.trend || 'stable'
  });
  return db('esg_metrics').where('id', id).first();
};

const updateESGMetric = async (id, data) => {
  const allowed = ['category', 'metric_name', 'current_value', 'target_value', 'unit', 'period', 'trend'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('esg_metrics').where('id', id).update(update);
  return db('esg_metrics').where('id', id).first();
};

const deleteESGMetric = async (id) => {
  return db('esg_metrics').where('id', id).del();
};

const createCyberControl = async (data) => {
  const [id] = await db('cybersecurity_status').insert({
    control_name: data.control_name,
    category: data.category || null,
    status: data.status || 'not-started',
    last_assessment_date: data.last_assessment_date || null,
    next_review_date: data.next_review_date || null,
    score: data.score || 0,
    notes: data.notes || null
  });
  return db('cybersecurity_status').where('id', id).first();
};

const updateCyberControl = async (id, data) => {
  const allowed = ['control_name', 'category', 'status', 'last_assessment_date', 'next_review_date', 'score', 'notes'];
  const update = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  if (Object.keys(update).length === 0) return null;
  await db('cybersecurity_status').where('id', id).update(update);
  return db('cybersecurity_status').where('id', id).first();
};

const deleteCyberControl = async (id) => {
  return db('cybersecurity_status').where('id', id).del();
};

module.exports = { getRiskRegister, getComplianceStatus, getRegulatoryCalendar, getESGSummary, getCybersecurityPosture, createRisk, updateRisk, deleteRisk, createComplianceItem, updateComplianceItem, deleteComplianceItem, createRegulatoryItem, updateRegulatoryItem, deleteRegulatoryItem, createESGMetric, updateESGMetric, deleteESGMetric, createCyberControl, updateCyberControl, deleteCyberControl };
