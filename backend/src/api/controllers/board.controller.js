const boardService = require('../../services/board.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.getBoardMeetings = catchAsync(async (req, res) => {
  const data = await boardService.getBoardMeetings();
  res.json({ success: true, data });
});

exports.getBoardPack = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const data = await boardService.getBoardPack(meetingId);
  if (!data) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, data });
});

exports.getShareholderRegistry = catchAsync(async (req, res) => {
  const data = await boardService.getShareholderRegistry();
  res.json({ success: true, data });
});

exports.getDividendStatus = catchAsync(async (req, res) => {
  const data = await boardService.getDividendStatus();
  res.json({ success: true, data });
});

exports.getBoardResolutions = catchAsync(async (req, res) => {
  const data = await boardService.getBoardResolutions();
  res.json({ success: true, data });
});

exports.createBoardMeeting = catchAsync(async (req, res) => {
  const { title, meeting_date, meeting_time, venue, agenda } = req.body;
  if (!title || !meeting_date) {
    return res.status(400).json({ success: false, message: 'Title and meeting date are required' });
  }
  const meeting = await boardService.createBoardMeeting({ title, meeting_date, meeting_time, venue, agenda });
  res.status(201).json({ success: true, data: meeting });
});

exports.createShareholder = catchAsync(async (req, res) => {
  const { name, email, phone, share_percentage, shares_count, share_type, joined_date } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Shareholder name is required' });
  }
  const shareholder = await boardService.createShareholder({ name, email, phone, share_percentage, shares_count, share_type, joined_date });
  res.status(201).json({ success: true, data: shareholder });
});

exports.createBoardResolution = catchAsync(async (req, res) => {
  const { title, description, meeting_id, resolution_date, proposed_by, outcome } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Resolution title is required' });
  }
  const resolution = await boardService.createBoardResolution({ title, description, meeting_id, resolution_date, proposed_by, outcome });
  res.status(201).json({ success: true, data: resolution });
});

exports.updateBoardMeeting = catchAsync(async (req, res) => {
  const { id } = req.params;
  const meeting = await boardService.updateBoardMeeting(id, req.body);
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, data: meeting });
});

exports.deleteBoardMeeting = catchAsync(async (req, res) => {
  const { id } = req.params;
  await boardService.deleteBoardMeeting(id);
  res.json({ success: true, message: 'Meeting deleted' });
});

exports.updateShareholder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const shareholder = await boardService.updateShareholder(id, req.body);
  if (!shareholder) return res.status(404).json({ success: false, message: 'Shareholder not found' });
  res.json({ success: true, data: shareholder });
});

exports.deleteShareholder = catchAsync(async (req, res) => {
  const { id } = req.params;
  await boardService.deleteShareholder(id);
  res.json({ success: true, message: 'Shareholder deleted' });
});

exports.updateBoardResolution = catchAsync(async (req, res) => {
  const { id } = req.params;
  const resolution = await boardService.updateBoardResolution(id, req.body);
  if (!resolution) return res.status(404).json({ success: false, message: 'Resolution not found' });
  res.json({ success: true, data: resolution });
});

exports.deleteBoardResolution = catchAsync(async (req, res) => {
  const { id } = req.params;
  await boardService.deleteBoardResolution(id);
  res.json({ success: true, message: 'Resolution deleted' });
});
