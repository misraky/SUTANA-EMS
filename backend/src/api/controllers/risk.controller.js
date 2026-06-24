const riskService = require('../../services/risk.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.getRiskRegister = catchAsync(async (req, res) => {
  const data = await riskService.getRiskRegister();
  res.json({ success: true, data });
});

exports.getComplianceStatus = catchAsync(async (req, res) => {
  const data = await riskService.getComplianceStatus();
  res.json({ success: true, data });
});

exports.getRegulatoryCalendar = catchAsync(async (req, res) => {
  const data = await riskService.getRegulatoryCalendar();
  res.json({ success: true, data });
});

exports.getESGSummary = catchAsync(async (req, res) => {
  const data = await riskService.getESGSummary();
  res.json({ success: true, data });
});

exports.getCybersecurityPosture = catchAsync(async (req, res) => {
  const data = await riskService.getCybersecurityPosture();
  res.json({ success: true, data });
});

exports.createRisk = catchAsync(async (req, res) => {
  const { title, description, category, likelihood, impact, risk_score, status, owner, mitigation_strategy } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Risk title is required' });
  const risk = await riskService.createRisk({ title, description, category, likelihood, impact, risk_score, status, owner, mitigation_strategy });
  res.status(201).json({ success: true, data: risk });
});

exports.updateRisk = catchAsync(async (req, res) => {
  const { id } = req.params;
  const risk = await riskService.updateRisk(id, req.body);
  if (!risk) return res.status(404).json({ success: false, message: 'Risk not found' });
  res.json({ success: true, data: risk });
});

exports.deleteRisk = catchAsync(async (req, res) => {
  const { id } = req.params;
  await riskService.deleteRisk(id);
  res.json({ success: true, message: 'Risk deleted' });
});

exports.createComplianceItem = catchAsync(async (req, res) => {
  const { requirement, regulation, status, last_review_date, next_review_date, responsible_owner, notes } = req.body;
  if (!requirement) return res.status(400).json({ success: false, message: 'Requirement is required' });
  const item = await riskService.createComplianceItem({ requirement, regulation, status, last_review_date, next_review_date, responsible_owner, notes });
  res.status(201).json({ success: true, data: item });
});

exports.updateComplianceItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const item = await riskService.updateComplianceItem(id, req.body);
  if (!item) return res.status(404).json({ success: false, message: 'Compliance item not found' });
  res.json({ success: true, data: item });
});

exports.deleteComplianceItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  await riskService.deleteComplianceItem(id);
  res.json({ success: true, message: 'Compliance item deleted' });
});

exports.createRegulatoryItem = catchAsync(async (req, res) => {
  const { title, description, authority, deadline, status, owner } = req.body;
  if (!title || !deadline) return res.status(400).json({ success: false, message: 'Title and deadline are required' });
  const item = await riskService.createRegulatoryItem({ title, description, authority, deadline, status, owner });
  res.status(201).json({ success: true, data: item });
});

exports.updateRegulatoryItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const item = await riskService.updateRegulatoryItem(id, req.body);
  if (!item) return res.status(404).json({ success: false, message: 'Regulatory item not found' });
  res.json({ success: true, data: item });
});

exports.deleteRegulatoryItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  await riskService.deleteRegulatoryItem(id);
  res.json({ success: true, message: 'Regulatory item deleted' });
});

exports.createESGMetric = catchAsync(async (req, res) => {
  const { category, metric_name, current_value, target_value, unit, period, trend } = req.body;
  if (!category || !metric_name) return res.status(400).json({ success: false, message: 'Category and metric name are required' });
  const metric = await riskService.createESGMetric({ category, metric_name, current_value, target_value, unit, period, trend });
  res.status(201).json({ success: true, data: metric });
});

exports.updateESGMetric = catchAsync(async (req, res) => {
  const { id } = req.params;
  const metric = await riskService.updateESGMetric(id, req.body);
  if (!metric) return res.status(404).json({ success: false, message: 'ESG metric not found' });
  res.json({ success: true, data: metric });
});

exports.deleteESGMetric = catchAsync(async (req, res) => {
  const { id } = req.params;
  await riskService.deleteESGMetric(id);
  res.json({ success: true, message: 'ESG metric deleted' });
});

exports.createCyberControl = catchAsync(async (req, res) => {
  const { control_name, category, status, last_assessment_date, next_review_date, score, notes } = req.body;
  if (!control_name) return res.status(400).json({ success: false, message: 'Control name is required' });
  const control = await riskService.createCyberControl({ control_name, category, status, last_assessment_date, next_review_date, score, notes });
  res.status(201).json({ success: true, data: control });
});

exports.updateCyberControl = catchAsync(async (req, res) => {
  const { id } = req.params;
  const control = await riskService.updateCyberControl(id, req.body);
  if (!control) return res.status(404).json({ success: false, message: 'Cybersecurity control not found' });
  res.json({ success: true, data: control });
});

exports.deleteCyberControl = catchAsync(async (req, res) => {
  const { id } = req.params;
  await riskService.deleteCyberControl(id);
  res.json({ success: true, message: 'Cybersecurity control deleted' });
});
