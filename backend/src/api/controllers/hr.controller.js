const hrService = require('../../services/hr.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.getHRSummary = catchAsync(async (req, res) => {
  const data = await hrService.getHRSummary();
  res.json({ success: true, data });
});

exports.getAttritionData = catchAsync(async (req, res) => {
  const { period = 'quarter' } = req.query;
  const data = await hrService.getAttritionData(period);
  res.json({ success: true, data });
});

exports.getCompensationData = catchAsync(async (req, res) => {
  const data = await hrService.getCompensationData();
  res.json({ success: true, data });
});

exports.getSuccessionPipeline = catchAsync(async (req, res) => {
  const data = await hrService.getSuccessionPipeline();
  res.json({ success: true, data });
});

exports.getDEIMetrics = catchAsync(async (req, res) => {
  const data = await hrService.getDEIMetrics();
  res.json({ success: true, data });
});
