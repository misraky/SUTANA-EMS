const crisisService = require('../../services/crisis.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.getCrisisStatus = catchAsync(async (req, res) => {
  const data = await crisisService.getCrisisStatus();
  res.json({ success: true, data });
});

exports.activateCrisisMode = catchAsync(async (req, res) => {
  const { activated_by, reason } = req.body;
  const data = await crisisService.activateCrisisMode({ activated_by, reason });
  res.json({ success: true, data, message: 'Crisis mode activated' });
});

exports.deactivateCrisisMode = catchAsync(async (req, res) => {
  const data = await crisisService.deactivateCrisisMode();
  res.json({ success: true, data, message: 'Crisis mode deactivated' });
});

exports.getEmergencyActions = catchAsync(async (req, res) => {
  const data = await crisisService.getEmergencyActions();
  res.json({ success: true, data });
});

exports.createEmergencyAction = catchAsync(async (req, res) => {
  const { title, description, priority, status, assigned_to, deadline } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Action title is required' });
  const action = await crisisService.createEmergencyAction({ title, description, priority, status, assigned_to, deadline });
  res.status(201).json({ success: true, data: action });
});

exports.updateEmergencyAction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const action = await crisisService.updateEmergencyAction(id, req.body);
  if (!action) return res.status(404).json({ success: false, message: 'Action not found' });
  res.json({ success: true, data: action });
});

exports.deleteEmergencyAction = catchAsync(async (req, res) => {
  const { id } = req.params;
  await crisisService.deleteEmergencyAction(id);
  res.json({ success: true, message: 'Action deleted' });
});

exports.fastTrackApproval = catchAsync(async (req, res) => {
  const { request_title, description, amount, requested_by } = req.body;
  if (!request_title) return res.status(400).json({ success: false, message: 'Request title is required' });
  const item = await crisisService.fastTrackApproval({ request_title, description, amount, requested_by });
  res.status(201).json({ success: true, data: item });
});

exports.getFastTrackApprovals = catchAsync(async (req, res) => {
  const data = await crisisService.getFastTrackApprovals();
  res.json({ success: true, data });
});

exports.approveFastTrack = catchAsync(async (req, res) => {
  const { id } = req.params;
  const item = await crisisService.approveFastTrack(id, req.user?.name || 'CEO');
  if (!item) return res.status(404).json({ success: false, message: 'Request not found' });
  res.json({ success: true, data: item, message: 'Request approved' });
});

exports.rejectFastTrack = catchAsync(async (req, res) => {
  const { id } = req.params;
  const item = await crisisService.rejectFastTrack(id);
  if (!item) return res.status(404).json({ success: false, message: 'Request not found' });
  res.json({ success: true, data: item, message: 'Request rejected' });
});
