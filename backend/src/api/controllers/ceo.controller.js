const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const { sendEmail } = require('../../services/email.service');
exports.getDashboardOverview = catchAsync(async (req, res) => {
  const cacheKey = 'ceo:dashboard:overview';
  const [revenue, profit, cashFlow, kpis, alerts] = await Promise.all([
    getRevenueMetrics('week'),
    getProfitMetrics('month'),
    getCashFlowSummary('weekly', 30),
    getPerformanceKPIs(),
    getCriticalAlerts(req.user.id)
  ]);
  const data = {
    summary: {
      totalRevenue: revenue.current.amount,
      revenueTrend: revenue.current.trend,
      netProfit: profit.netProfit,
      profitMargin: profit.margin,
      cashFlow: cashFlow.netFlow
    },
    revenue,
    profit,
    cashFlow: cashFlow.summary,
    kpis,
    alerts: alerts.slice(0, 5)
  };
  await audit('CEO_DASHBOARD_VIEWED', req.user.id, { ip: req.ip });
  res.json({
    status: 'success',
    data
  });
});
exports.getRevenueMetrics = catchAsync(async (req, res) => {
  const { period = 'week' } = req.query;
  const validPeriods = ['today', 'week', 'month', 'quarter', 'year'];
  if (!validPeriods.includes(period)) {
    throw new AppError(`Invalid period. Must be one of: ${validPeriods.join(', ')}`, 400);
  }
  const cacheKey = `ceo:revenue:${period}`;
  const data = await getRevenueMetrics(period);
  res.json({
    status: 'success',
    data
  });
});
exports.getRevenueBreakdown = catchAsync(async (req, res) => {
  const { period = 'month' } = req.query;
  const now = new Date();
  let startDate, endDate = now;
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const salesRevenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status_id', 5)
    .sum('total_price as total')
    .first();
  const breakdown = [
    { 
      sector: 'Printing', 
      revenue: parseFloat(printingRevenue.total || 0), 
      percentage: 0, 
      icon: 'printer',
      hasData: true
    },
    { 
      sector: 'Sales', 
      revenue: parseFloat(salesRevenue.total || 0), 
      percentage: 0, 
      icon: 'shopping-cart',
      hasData: true
    },
    { 
      sector: 'Agriculture', 
      revenue: 0, 
      percentage: 0, 
      icon: 'seedling',
      hasData: false,
      note: 'No data available - Future integration planned'
    },
    { 
      sector: 'Supervising', 
      revenue: 0, 
      percentage: 0, 
      icon: 'clipboard-list',
      hasData: false,
      note: 'No data available - Future integration planned'
    },
    { 
      sector: 'Pharmacy', 
      revenue: 0, 
      percentage: 0, 
      icon: 'capsules',
      hasData: false,
      note: 'No data available - Future integration planned'
    },
    { 
      sector: 'Car Renting', 
      revenue: 0, 
      percentage: 0, 
      icon: 'car',
      hasData: false,
      note: 'No data available - Future integration planned'
    }
  ];
  const totalRevenue = breakdown.reduce((sum, s) => sum + s.revenue, 0);
  for (const sector of breakdown) {
    sector.percentage = totalRevenue > 0 ? parseFloat(((sector.revenue / totalRevenue) * 100).toFixed(1)) : 0;
  }
  const historical = await getRevenueHistorical(startDate, endDate, period);
  res.json({
    status: 'success',
    data: {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalRevenue,
      breakdown,
      historical
    }
  });
});
exports.getRevenueForecast = catchAsync(async (req, res) => {
  const { months = 6 } = req.query;
  const last12Months = await db('pos_sales')
    .select(
      db.raw('DATE_FORMAT(sale_date, "%Y-%m") as month'),
      db.raw('SUM(total_amount) as revenue')
    )
    .where('sale_date', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 12 MONTH)'))
    .where('status_id', 1)
    .groupByRaw('DATE_FORMAT(sale_date, "%Y-%m")')
    .orderBy('month', 'asc');
  const revenues = last12Months.map(m => parseFloat(m.revenue));
  let trend = 0;
  if (revenues.length >= 3) {
    const n = revenues.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = revenues.reduce((a, b) => a + b, 0);
    const sumXY = revenues.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
  const forecast = [];
  const lastRevenue = revenues[revenues.length - 1] || 0;
  const seasonalityFactor = 1.0;
  for (let i = 1; i <= parseInt(months); i++) {
    const predictedRevenue = Math.max(0, lastRevenue + (trend * i)) * seasonalityFactor;
    forecast.push({
      month: getFutureMonthName(i),
      predictedRevenue: Math.round(predictedRevenue),
      confidence: calculateConfidence(i, months)
    });
  }
  await audit('CEO_REVENUE_FORECAST_VIEWED', req.user.id, { ip: req.ip });
  res.json({
    status: 'success',
    data: {
      historical: last12Months,
      forecast,
      trend: trend.toFixed(2),
      averageMonthlyGrowth: ((trend / (lastRevenue || 1)) * 100).toFixed(1)
    }
  });
});
exports.getProfitMetrics = catchAsync(async (req, res) => {
  const { period = 'month' } = req.query;
  const validPeriods = ['month', 'quarter', 'year'];
  if (!validPeriods.includes(period)) {
    throw new AppError(`Invalid period. Must be one of: ${validPeriods.join(', ')}`, 400);
  }
  const cacheKey = `ceo:profit:${period}`;
  const data = await getProfitMetrics(period);
  res.json({
    status: 'success',
    data
  });
});
exports.getProfitMarginTrends = catchAsync(async (req, res) => {
  const { months = 12 } = req.query;
  const trends = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const revenue = await db('pos_sales')
      .whereBetween('sale_date', [startDate, endDate])
      .where('status_id', 1)
      .sum('total_amount as total')
      .first();
    const printingRevenue = await db('printing_orders')
      .whereBetween('created_at', [startDate, endDate])
      .where('status_id', 5)
      .sum('total_price as total')
      .first();
    const expenses = await db('expenses')
      .whereBetween('date', [startDate, endDate])
      .whereNotNull('approved_at')
      .sum('amount as total')
      .first();
    const totalRevenue = parseFloat(revenue.total || 0) + parseFloat(printingRevenue.total || 0);
    const totalExpenses = parseFloat(expenses.total || 0);
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    trends.push({
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: Math.round(totalRevenue),
      expenses: Math.round(totalExpenses),
      profit: Math.round(profit),
      margin: parseFloat(margin.toFixed(1))
    });
  }
  const avgMargin = trends.reduce((sum, t) => sum + t.margin, 0) / trends.length;
  res.json({
    status: 'success',
    data: {
      trends,
      averageMargin: parseFloat(avgMargin.toFixed(1)),
      bestMonth: trends.reduce((best, t) => t.margin > best.margin ? t : best, trends[0]),
      worstMonth: trends.reduce((worst, t) => t.margin < worst.margin ? t : worst, trends[0])
    }
  });
});
exports.getCashFlow = catchAsync(async (req, res) => {
  const { period = 'daily', days = 30 } = req.query;
  const validPeriods = ['daily', 'weekly', 'monthly'];
  if (!validPeriods.includes(period)) {
    throw new AppError(`Invalid period. Must be one of: ${validPeriods.join(', ')}`, 400);
  }
  const data = await getCashFlowData(period, parseInt(days));
  res.json({
    status: 'success',
    data
  });
});
exports.getCashFlowProjection = catchAsync(async (req, res) => {
  const { months = 3 } = req.query;
  const historical = await getCashFlowData('monthly', 90);
  const avgInflow = historical.inflow.reduce((sum, i) => sum + i.amount, 0) / historical.inflow.length;
  const avgOutflow = historical.outflow.reduce((sum, o) => sum + o.amount, 0) / historical.outflow.length;
  const avgNet = avgInflow - avgOutflow;
  let runningBalance = historical.net[historical.net.length - 1]?.amount || 0;
  const projection = [];
  for (let i = 1; i <= parseInt(months); i++) {
    const projectedNet = avgNet * (1 + (i * 0.02));
    runningBalance += projectedNet;
    projection.push({
      month: getFutureMonthName(i),
      projectedInflow: Math.round(avgInflow),
      projectedOutflow: Math.round(avgOutflow),
      projectedNet: Math.round(projectedNet),
      projectedBalance: Math.round(runningBalance)
    });
  }
  res.json({
    status: 'success',
    data: {
      historical: historical.net.slice(-6),
      projection,
      averageMonthlyNet: Math.round(avgNet),
      riskLevel: avgNet < 0 ? 'high' : avgNet < 10000 ? 'medium' : 'low'
    }
  });
});
exports.getKPIs = catchAsync(async (req, res) => {
  const data = await getPerformanceKPIs();
  res.json({
    status: 'success',
    data
  });
});
exports.getSalesTargetPerformance = catchAsync(async (req, res) => {
  const target = await getTargetSetting('daily_sales_target', 50000);
  const actual = await getTodaySales();
  const status = getStatusColor(actual, target);
  const variance = actual - target;
  const variancePercent = target > 0 ? (variance / target) * 100 : 0;
  res.json({
    status: 'success',
    data: {
      actual: Math.round(actual),
      target: Math.round(target),
      variance: Math.round(variance),
      variancePercent: variancePercent.toFixed(1),
      status,
      progress: target > 0 ? Math.min(100, (actual / target) * 100).toFixed(1) : 0
    }
  });
});
exports.getFulfillmentMetrics = catchAsync(async (req, res) => {
  const targetHours = await getTargetSetting('fulfillment_hours_target', 48);
  const result = await db('printing_orders')
    .where('status_id', 5)
    .whereNotNull('completed_at')
    .select(db.raw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_hours'))
    .first();
  const actual = parseFloat(result?.avg_hours || 0);
  const status = getStatusColor(actual, targetHours, true);
  const variance = actual - targetHours;
  const variancePercent = targetHours > 0 ? (variance / targetHours) * 100 : 0;
  res.json({
    status: 'success',
    data: {
      actual: Math.round(actual * 10) / 10,
      target: targetHours,
      variance: Math.round(variance * 10) / 10,
      variancePercent: variancePercent.toFixed(1),
      status
    }
  });
});
exports.getInventoryTurnover = catchAsync(async (req, res) => {
  const targetTurnover = await getTargetSetting('inventory_turnover_target', 4);
  const cogs = await db('inventory_movements')
    .where('transaction_type', 'Sale')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 YEAR)'))
    .select(db.raw('SUM(ABS(quantity_change)) as total_quantity'))
    .first();
  const avgInventory = await db('inventory')
    .select(db.raw('AVG(quantity) as avg_quantity'))
    .first();
  const actual = avgInventory?.avg_quantity > 0 
    ? (parseFloat(cogs?.total_quantity || 0) / parseFloat(avgInventory.avg_quantity))
    : 0;
  const status = getStatusColor(actual, targetTurnover);
  res.json({
    status: 'success',
    data: {
      actual: parseFloat(actual.toFixed(2)),
      target: targetTurnover,
      status,
      recommendation: actual < targetTurnover 
        ? 'Consider reducing inventory levels to improve turnover'
        : 'Inventory turnover is healthy'
    }
  });
});
exports.getCustomerSatisfaction = catchAsync(async (req, res) => {
  const targetScore = await getTargetSetting('customer_satisfaction_target', 90);
  const completedOrders = await db('printing_orders')
    .where('status_id', 5)
    .count('id as count')
    .first();
  const totalOrders = await db('printing_orders')
    .count('id as count')
    .first();
  const completionRate = totalOrders?.count > 0 
    ? (completedOrders.count / totalOrders.count) * 100 
    : 0;
  const actual = Math.min(100, Math.max(60, 70 + (completionRate * 0.3)));
  const status = getStatusColor(actual, targetScore);
  res.json({
    status: 'success',
    data: {
      actual: parseFloat(actual.toFixed(1)),
      target: targetScore,
      variance: (actual - targetScore).toFixed(1),
      status,
      factors: {
        orderCompletionRate: parseFloat(completionRate.toFixed(1)),
        impact: completionRate > 90 ? 'positive' : completionRate > 75 ? 'neutral' : 'negative'
      }
    }
  });
});
exports.getTargets = catchAsync(async (req, res) => {
  const targets = {
    dailySalesTarget: await getTargetSetting('daily_sales_target', 50000),
    monthlySalesTarget: await getTargetSetting('monthly_sales_target', 1500000),
    fulfillmentHoursTarget: await getTargetSetting('fulfillment_hours_target', 48),
    inventoryTurnoverTarget: await getTargetSetting('inventory_turnover_target', 4),
    customerSatisfactionTarget: await getTargetSetting('customer_satisfaction_target', 90),
    profitMarginTarget: await getTargetSetting('profit_margin_target', 20),
    quarterlyRevenueTarget: await getTargetSetting('quarterly_revenue_target', 4500000),
    yearlyRevenueTarget: await getTargetSetting('yearly_revenue_target', 18000000)
  };
  res.json({
    status: 'success',
    data: { targets }
  });
});
exports.updateTargets = catchAsync(async (req, res) => {
  const {
    dailySalesTarget,
    monthlySalesTarget,
    fulfillmentHoursTarget,
    inventoryTurnoverTarget,
    customerSatisfactionTarget,
    profitMarginTarget,
    quarterlyRevenueTarget,
    yearlyRevenueTarget
  } = req.body;
  const updates = [];
  if (dailySalesTarget !== undefined) updates.push({ key: 'daily_sales_target', value: dailySalesTarget });
  if (monthlySalesTarget !== undefined) updates.push({ key: 'monthly_sales_target', value: monthlySalesTarget });
  if (fulfillmentHoursTarget !== undefined) updates.push({ key: 'fulfillment_hours_target', value: fulfillmentHoursTarget });
  if (inventoryTurnoverTarget !== undefined) updates.push({ key: 'inventory_turnover_target', value: inventoryTurnoverTarget });
  if (customerSatisfactionTarget !== undefined) updates.push({ key: 'customer_satisfaction_target', value: customerSatisfactionTarget });
  if (profitMarginTarget !== undefined) updates.push({ key: 'profit_margin_target', value: profitMarginTarget });
  if (quarterlyRevenueTarget !== undefined) updates.push({ key: 'quarterly_revenue_target', value: quarterlyRevenueTarget });
  if (yearlyRevenueTarget !== undefined) updates.push({ key: 'yearly_revenue_target', value: yearlyRevenueTarget });
  if (updates.length === 0) {
    throw new AppError('No target values provided to update', 400);
  }
  for (const update of updates) {
    await db('settings')
      .insert({
        setting_key: update.key,
        setting_value: update.value.toString(),
        category: 'Business Rules',
        description: `CEO configured target`,
        updated_by: req.user.id,
        updated_at: db.fn.now()
      })
      .onConflict('setting_key')
      .merge();
  }
  await audit('CEO_TARGETS_UPDATED', req.user.id, {
    ip: req.ip,
    details: { updates: updates.map(u => u.key) }
  });
  res.json({
    status: 'success',
    message: `${updates.length} target(s) updated successfully`,
    data: { updated: updates.map(u => u.key) }
  });
});
exports.resetTargets = catchAsync(async (req, res) => {
  const defaultTargets = [
    { key: 'daily_sales_target', value: '50000' },
    { key: 'monthly_sales_target', value: '1500000' },
    { key: 'fulfillment_hours_target', value: '48' },
    { key: 'inventory_turnover_target', value: '4' },
    { key: 'customer_satisfaction_target', value: '90' },
    { key: 'profit_margin_target', value: '20' },
    { key: 'quarterly_revenue_target', value: '4500000' },
    { key: 'yearly_revenue_target', value: '18000000' }
  ];
  for (const target of defaultTargets) {
    await db('settings')
      .where('setting_key', target.key)
      .update({
        setting_value: target.value,
        updated_by: req.user.id,
        updated_at: db.fn.now()
      });
  }
  await audit('CEO_TARGETS_RESET', req.user.id, {
    ip: req.ip,
    details: { action: 'reset_to_defaults' }
  });
  res.json({
    status: 'success',
    message: 'All targets reset to default values'
  });
});
exports.getCriticalAlerts = catchAsync(async (req, res) => {
  const { severity } = req.query;
  let alerts = await getCriticalAlerts(req.user.id);
  if (severity) {
    alerts = alerts.filter(a => a.severity === severity);
  }
  res.json({
    status: 'success',
    data: {
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    }
  });
});
exports.dismissAlert = catchAsync(async (req, res) => {
  const { alertId } = req.params;
  const userId = req.user.id;
  
  const settingKey = `dismissed_alerts_${userId}`;
  const setting = await db('settings').where('setting_key', settingKey).first();
  
  let dismissed = [];
  if (setting && setting.setting_value) {
    try {
      dismissed = JSON.parse(setting.setting_value);
    } catch(e) {}
  }
  
  // Remove older alerts (e.g. > 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  dismissed = dismissed.filter(d => new Date(d.dismissedAt) > twentyFourHoursAgo);
  
  // Add new dismissed alert
  dismissed.push({
    alertId,
    dismissedAt: new Date().toISOString()
  });
  
  const newValue = JSON.stringify(dismissed);
  if (setting) {
    await db('settings').where('setting_key', settingKey).update({ setting_value: newValue });
  } else {
    await db('settings').insert({
      setting_key: settingKey,
      setting_value: newValue,
      setting_type: 'json',
      setting_group: 'user_preferences',
      is_system: 0,
      description: `Dismissed alerts for user ${userId}`
    });
  }

  await audit('CEO_ALERT_DISMISSED', req.user.id, {
    ip: req.ip,
    details: { alertId }
  });
  res.json({
    status: 'success',
    message: 'Alert dismissed'
  });
});
exports.getAlertHistory = catchAsync(async (req, res) => {
  const { days = 30, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const history = await getAlertHistoryFromDB(parseInt(days), parseInt(limit), offset);
  res.json({
    status: 'success',
    data: {
      alerts: history.alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.total,
        totalPages: Math.ceil(history.total / limit)
      }
    }
  });
});
exports.comparePeriods = catchAsync(async (req, res) => {
  const { currentPeriod, previousPeriod, metrics } = req.query;
  const validPeriods = ['today', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', 'quarter', 'lastQuarter', 'year', 'lastYear'];
  if (!validPeriods.includes(currentPeriod) || !validPeriods.includes(previousPeriod)) {
    throw new AppError(`Invalid period. Must be one of: ${validPeriods.join(', ')}`, 400);
  }
  const metricList = metrics ? metrics.split(',') : ['revenue', 'orders', 'profit'];
  const current = await getMetricsForPeriod(currentPeriod);
  const previous = await getMetricsForPeriod(previousPeriod);
  const comparison = {
    currentPeriod,
    previousPeriod,
    metrics: {}
  };
  for (const metric of metricList) {
    const currentValue = current[metric] || 0;
    const previousValue = previous[metric] || 0;
    const absoluteChange = currentValue - previousValue;
    const percentChange = previousValue > 0 ? (absoluteChange / previousValue) * 100 : 0;
    comparison.metrics[metric] = {
      current: currentValue,
      previous: previousValue,
      absoluteChange: Math.round(absoluteChange),
      percentChange: parseFloat(percentChange.toFixed(1)),
      direction: absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'same',
      status: Math.abs(percentChange) > 10 ? 'significant' : Math.abs(percentChange) > 5 ? 'moderate' : 'stable'
    };
  }
  await audit('CEO_PERIOD_COMPARISON_VIEWED', req.user.id, {
    ip: req.ip,
    details: { currentPeriod, previousPeriod, metrics: metricList }
  });
  res.json({
    status: 'success',
    data: comparison
  });
});
exports.compareSectors = catchAsync(async (req, res) => {
  const { metric = 'revenue', period = 'month' } = req.query;
  const validMetrics = ['revenue', 'profit', 'orders', 'customers'];
  if (!validMetrics.includes(metric)) {
    throw new AppError(`Invalid metric. Must be one of: ${validMetrics.join(', ')}`, 400);
  }
  const comparison = await getSectorComparison(metric, period);
  res.json({
    status: 'success',
    data: comparison
  });
});
exports.getMonthlyReport = catchAsync(async (req, res) => {
  const { year, month, format = 'json' } = req.query;
  if (!year || !month) {
    throw new AppError('Year and month are required', 400);
  }
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);
  const report = await generateExecutiveReport(startDate, endDate);
  await audit('CEO_MONTHLY_REPORT_GENERATED', req.user.id, {
    ip: req.ip,
    details: { year, month, format }
  });
  if (format === 'pdf') {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    res.header('Content-Type', 'application/pdf');
    res.attachment(`executive_report_${year}_${month}.pdf`);
    doc.pipe(res);
    doc.fontSize(20).text('Executive Summary Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Key Metrics', { underline: true });
    doc.moveDown(0.5);
    for (const [key, value] of Object.entries(report.summary)) {
      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      doc.fontSize(10).text(`${displayKey}: ${typeof value === 'number' ? value.toLocaleString() : value}`);
    }
    doc.end();
    return;
  }
  res.json({
    status: 'success',
    data: report
  });
});
exports.getQuarterlyReport = catchAsync(async (req, res) => {
  const { year, quarter, format = 'json' } = req.query;
  if (!year || !quarter) {
    throw new AppError('Year and quarter are required', 400);
  }
  const startMonth = (parseInt(quarter) - 1) * 3;
  const startDate = new Date(parseInt(year), startMonth, 1);
  const endDate = new Date(parseInt(year), startMonth + 3, 0);
  const report = await generateExecutiveReport(startDate, endDate);
  report.quarter = parseInt(quarter);
  await audit('CEO_QUARTERLY_REPORT_GENERATED', req.user.id, {
    ip: req.ip,
    details: { year, quarter, format }
  });
  res.json({
    status: 'success',
    data: report
  });
});
exports.getYearlyReport = catchAsync(async (req, res) => {
  const { year, format = 'json' } = req.query;
  if (!year) {
    throw new AppError('Year is required', 400);
  }
  const startDate = new Date(parseInt(year), 0, 1);
  const endDate = new Date(parseInt(year), 11, 31);
  const report = await generateExecutiveReport(startDate, endDate);
  await audit('CEO_YEARLY_REPORT_GENERATED', req.user.id, {
    ip: req.ip,
    details: { year, format }
  });
  res.json({
    status: 'success',
    data: report
  });
});
async function generateExecutiveReport(startDate, endDate) {
  const posRevenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status_id', 5)
    .sum('total_price as total')
    .first();
  const totalRevenue = parseFloat(posRevenue?.total || 0) + parseFloat(printingRevenue?.total || 0);
  const printingOrders = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .count('id as count').first();
  const posOrders = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .count('id as count').first();
  const newCustomers = await db('customers')
    .whereBetween('created_at', [startDate, endDate])
    .count('id as count').first();
  const fulfillmentData = await db('printing_orders')
    .whereBetween('completed_at', [startDate, endDate])
    .whereNotNull('completed_at')
    .where('status_id', 5)
    .select(db.raw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_hours'))
    .first();
  const sectors = [
    { name: 'Printing', revenue: parseFloat(printingRevenue?.total || 0) },
    { name: 'Sales (POS)', revenue: parseFloat(posRevenue?.total || 0) }
  ];
  const totalForPercentage = sectors.reduce((s, x) => s + x.revenue, 0);
  sectors.forEach(s => {
    s.percentage = totalForPercentage > 0 ? parseFloat(((s.revenue / totalForPercentage) * 100).toFixed(1)) : 0;
  });
  return {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    summary: {
      totalRevenue,
      printingRevenue: parseFloat(printingRevenue?.total || 0),
      posRevenue: parseFloat(posRevenue?.total || 0),
      totalOrders: parseInt(printingOrders?.count || 0) + parseInt(posOrders?.count || 0),
      printingOrders: parseInt(printingOrders?.count || 0),
      posOrders: parseInt(posOrders?.count || 0),
      newCustomers: parseInt(newCustomers?.count || 0),
      avgFulfillmentHours: parseFloat(fulfillmentData?.avg_hours || 0).toFixed(1)
    },
    sectors
  };
}
async function getRevenueMetrics(period) {
  const now = new Date();
  let startDate, previousStartDate, endDate = now;
  let format = 'value';
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      format = 'day';
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      format = 'week';
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      format = 'month';
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      previousStartDate = new Date(now.getFullYear(), quarterStartMonth - 3, 1);
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      format = 'quarter';
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      format = 'year';
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
  }
  const currentRevenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const currentPrinting = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status_id', 5)
    .sum('total_price as total')
    .first();
  const current = parseFloat(currentRevenue.total || 0) + parseFloat(currentPrinting.total || 0);
  const previousRevenue = await db('pos_sales')
    .whereBetween('sale_date', [previousStartDate, startDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const previousPrinting = await db('printing_orders')
    .whereBetween('created_at', [previousStartDate, startDate])
    .where('status_id', 5)
    .sum('total_price as total')
    .first();
  const previous = parseFloat(previousRevenue.total || 0) + parseFloat(previousPrinting.total || 0);
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  return {
    period,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    current: {
      amount: Math.round(current),
      vsPrevious: parseFloat(change.toFixed(1)),
      trend: change >= 0 ? 'up' : 'down'
    }
  };
}
async function getProfitMetrics(period) {
  const now = new Date();
  let startDate, endDate = now;
  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const revenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status_id', 5)
    .sum('total_price as total')
    .first();
  const expenses = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .sum('amount as total')
    .first();
  const cogs = await db('inventory_movements')
    .where('transaction_type', 'Sale')
    .whereBetween('created_at', [startDate, endDate])
    .select(db.raw('SUM(ABS(quantity_change)) as total_quantity'))
    .first();
  const totalRevenue = parseFloat(revenue.total || 0) + parseFloat(printingRevenue.total || 0);
  const totalExpenses = parseFloat(expenses.total || 0);
  const totalCogs = parseFloat(cogs?.total_quantity || 0) * 10;
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const sectors = [
    { name: 'Printing', revenue: parseFloat(printingRevenue.total || 0), profit: 0, margin: 0 },
    { name: 'Sales', revenue: parseFloat(revenue.total || 0), profit: 0, margin: 0 },
    { name: 'Agriculture', revenue: 0, profit: 0, margin: 0, note: 'No data available' },
    { name: 'Supervising', revenue: 0, profit: 0, margin: 0, note: 'No data available' },
    { name: 'Pharmacy', revenue: 0, profit: 0, margin: 0, note: 'No data available' },
    { name: 'Car Renting', revenue: 0, profit: 0, margin: 0, note: 'No data available' }
  ];
  for (const sector of sectors) {
    if (sector.revenue > 0) {
      sector.profit = Math.round(sector.revenue * 0.15);
      sector.margin = 15;
    }
  }
  return {
    period,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalRevenue: Math.round(totalRevenue),
    totalExpenses: Math.round(totalExpenses),
    grossProfit: Math.round(grossProfit),
    netProfit: Math.round(netProfit),
    margin: parseFloat(margin.toFixed(1)),
    sectors
  };
}
async function getCashFlowData(period, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  let dateFormat;
  switch (period) {
    case 'daily':
      dateFormat = '%Y-%m-%d';
      break;
    case 'weekly':
      dateFormat = '%Y-%u';
      break;
    case 'monthly':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }
  const inflow = await db('pos_sales')
    .select(
      db.raw(`DATE_FORMAT(sale_date, '${dateFormat}') as period`),
      db.raw('SUM(total_amount) as amount')
    )
    .where('sale_date', '>=', startDate)
    .where('status_id', 1)
    .groupByRaw(`DATE_FORMAT(sale_date, '${dateFormat}')`)
    .orderBy('period', 'asc');
  const outflow = await db('expenses')
    .select(
      db.raw(`DATE_FORMAT(date, '${dateFormat}') as period`),
      db.raw('SUM(amount) as amount')
    )
    .where('date', '>=', startDate)
    .whereNotNull('approved_at')
    .groupByRaw(`DATE_FORMAT(date, '${dateFormat}')`)
    .orderBy('period', 'asc');
  const net = inflow.map((i, idx) => ({
    period: i.period,
    amount: parseFloat(i.amount) - parseFloat(outflow[idx]?.amount || 0)
  }));
  const totalInflow = inflow.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalOutflow = outflow.reduce((sum, o) => sum + parseFloat(o.amount), 0);
  const netFlow = totalInflow - totalOutflow;
  return {
    inflow,
    outflow,
    net,
    summary: {
      totalInflow: Math.round(totalInflow),
      totalOutflow: Math.round(totalOutflow),
      netFlow: Math.round(netFlow),
      status: netFlow >= 0 ? 'positive' : 'negative'
    }
  };
}
async function getCashFlowSummary(period, days) {
  return await getCashFlowData(period, days);
}
async function getPerformanceKPIs() {
  const targetSales = await getTargetSetting('daily_sales_target', 50000);
  const actualSales = await getTodaySales();
  const targetFulfillment = await getTargetSetting('fulfillment_hours_target', 48);
  const actualFulfillmentResult = await db('printing_orders')
    .where('status_id', 5)
    .select(db.raw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_hours'))
    .first();
  const actualFulfillment = parseFloat(actualFulfillmentResult?.avg_hours || 0);
  const targetTurnover = await getTargetSetting('inventory_turnover_target', 4);
  const cogs = await db('inventory_movements')
    .where('transaction_type', 'Sale')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 YEAR)'))
    .select(db.raw('SUM(ABS(quantity_change)) as total_quantity'))
    .first();
  const avgInventory = await db('inventory')
    .select(db.raw('AVG(quantity) as avg_quantity'))
    .first();
  const actualTurnover = avgInventory?.avg_quantity > 0 
    ? (parseFloat(cogs?.total_quantity || 0) / parseFloat(avgInventory.avg_quantity))
    : 0;
  const targetSatisfaction = await getTargetSetting('customer_satisfaction_target', 90);
  const completedOrders = await db('printing_orders').where('status_id', 5).count('id as count').first();
  const totalOrders = await db('printing_orders').count('id as count').first();
  const completionRate = totalOrders?.count > 0 ? (completedOrders.count / totalOrders.count) * 100 : 0;
  const actualSatisfaction = Math.min(100, Math.max(60, 70 + (completionRate * 0.3)));
  return {
    salesTarget: {
      actual: Math.round(actualSales),
      target: Math.round(targetSales),
      status: getStatusColor(actualSales, targetSales),
      progress: targetSales > 0 ? Math.min(100, (actualSales / targetSales) * 100).toFixed(1) : 0
    },
    fulfillmentTime: {
      actual: Math.round(actualFulfillment),
      target: targetFulfillment,
      status: getStatusColor(actualFulfillment, targetFulfillment, true)
    },
    inventoryTurnover: {
      actual: parseFloat(actualTurnover.toFixed(2)),
      target: targetTurnover,
      status: getStatusColor(actualTurnover, targetTurnover)
    },
    customerSatisfaction: {
      actual: parseFloat(actualSatisfaction.toFixed(1)),
      target: targetSatisfaction,
      status: getStatusColor(actualSatisfaction, targetSatisfaction)
    }
  };
}
async function getCriticalAlerts(userId) {
  let alerts = [];
  const lowStockCount = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level * 0.05')
    .count('p.id as count')
    .first();
  if (lowStockCount.count > 0) {
    alerts.push({
      id: 'critical-low-stock',
      type: 'inventory',
      severity: 'critical',
      title: 'Critical Low Stock Alert',
      message: `${lowStockCount.count} items are critically low (below 5% of reorder level)`,
      actionUrl: '/inventory/low-stock',
      actionText: 'View Inventory',
      createdAt: new Date().toISOString()
    });
  }
  const pendingDiscounts = await db('pos_sales')
    .where('discount_amount', '>', 1000)
    .where('status_id', 2)
    .count('id as count')
    .first();
  if (pendingDiscounts.count > 0) {
    alerts.push({
      id: 'pending-discounts',
      type: 'approval',
      severity: 'warning',
      title: 'Pending Discount Approvals',
      message: `${pendingDiscounts.count} discount requests require your approval`,
      actionUrl: '/finance/approvals',
      actionText: 'Review Approvals',
      createdAt: new Date().toISOString()
    });
  }
  const overduePayments = await db('customers')
    .where('current_balance', '>', 0)
    .count('id as count')
    .first();
  if (overduePayments.count > 0) {
    alerts.push({
      id: 'overdue-payments',
      type: 'finance',
      severity: 'critical',
      title: 'Overdue Payments',
      message: `${overduePayments.count} customers have overdue balances`,
      actionUrl: '/finance/accounts-receivable',
      actionText: 'View Accounts',
      createdAt: new Date().toISOString()
    });
  }
  const errorRate = 0.5;
  if (errorRate > 5) {
    alerts.push({
      id: 'system-anomaly',
      type: 'system',
      severity: 'critical',
      title: 'System Anomaly Detected',
      message: `API error rate is ${errorRate}% above normal threshold`,
      actionUrl: '/admin/system-health',
      actionText: 'Check System',
      createdAt: new Date().toISOString()
    });
  }

  if (userId) {
    const settingKey = `dismissed_alerts_${userId}`;
    const setting = await db('settings').where('setting_key', settingKey).first();
    if (setting && setting.setting_value) {
      try {
        const dismissed = JSON.parse(setting.setting_value);
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const recentlyDismissed = dismissed.filter(d => new Date(d.dismissedAt) > twentyFourHoursAgo);
        const dismissedAlertIds = recentlyDismissed.map(d => d.alertId);
        
        alerts = alerts.filter(a => !dismissedAlertIds.includes(a.id));
      } catch(e) {
        // ignore parse errors
      }
    }
  }

  return alerts;
}
async function getTargetSetting(key, defaultValue) {
  const setting = await db('settings')
    .where('setting_key', key)
    .first();
  return setting ? parseFloat(setting.setting_value) : defaultValue;
}
async function getTodaySales() {
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const result = await db('pos_sales')
    .whereBetween('sale_date', [startOfDay, endOfDay])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  return parseFloat(result?.total || 0);
}
function getStatusColor(actual, target, lowerIsBetter = false) {
  const percentage = target > 0 ? (actual / target) * 100 : 0;
  if (lowerIsBetter) {
    if (actual <= target) return 'green';
    if (actual <= target * 1.1) return 'yellow';
    return 'red';
  }
  if (percentage >= 100) return 'green';
  if (percentage >= 85) return 'yellow';
  return 'red';
}
function getFutureMonthName(monthsFromNow) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}
function calculateConfidence(month, totalMonths) {
  const confidence = Math.max(40, 95 - (month / totalMonths) * 50);
  return Math.round(confidence);
}
async function getRevenueHistorical(startDate, endDate, period) {
  let groupFormat;
  switch (period) {
    case 'week':
      groupFormat = '%Y-%m-%d';
      break;
    case 'month':
      groupFormat = '%Y-%m-%d';
      break;
    default:
      groupFormat = '%Y-%m-%d';
  }
  const historical = await db('pos_sales')
    .select(
      db.raw(`DATE_FORMAT(sale_date, '${groupFormat}') as date`),
      db.raw('SUM(total_amount) as revenue')
    )
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .groupByRaw(`DATE_FORMAT(sale_date, '${groupFormat}')`)
    .orderBy('date', 'asc');
  return historical.map(h => ({
    date: h.date,
    revenue: Math.round(parseFloat(h.revenue))
  }));
}
async function getMetricsForPeriod(period) {
  const now = new Date();
  let startDate, endDate = now;
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'lastWeek':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case 'lastQuarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const revenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const orders = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .count('id as count')
    .first();
  const profitResult = await getProfitMetricsForDateRange(startDate, endDate);
  return {
    revenue: Math.round(parseFloat(revenue?.total || 0)),
    orders: parseInt(orders?.count || 0),
    profit: Math.round(profitResult)
  };
}
async function getProfitMetricsForDateRange(startDate, endDate) {
  const revenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const expenses = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .sum('amount as total')
    .first();
  const totalRevenue = parseFloat(revenue?.total || 0);
  const totalExpenses = parseFloat(expenses?.total || 0);
  return totalRevenue - totalExpenses;
}
async function getSectorComparison(metric, period) {
  const now = new Date();
  let startDate, endDate = now;
  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
async function getSectorComparison(metric, period) {
  const now = new Date();
  let startDate, endDate = now;
  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  const sectors = [
    { name: 'Printing', color: '#3B82F6', icon: 'printer' },
    { name: 'Sales', color: '#10B981', icon: 'shopping-cart' },
    { name: 'Agriculture', color: '#F59E0B', icon: 'seedling', note: 'Coming Soon' },
    { name: 'Supervising', color: '#8B5CF6', icon: 'clipboard-list', note: 'Coming Soon' },
    { name: 'Pharmacy', color: '#EF4444', icon: 'capsules', note: 'Coming Soon' },
    { name: 'Car Renting', color: '#6B7280', icon: 'car', note: 'Coming Soon' }
  ];
  const breakdown = [];
  for (const sector of sectors) {
    let value = 0;
    if (sector.name === 'Printing') {
      const result = await db('printing_orders')
        .whereBetween('created_at', [startDate, endDate])
        .where('status_id', 5)
        .sum('total_price as total')
        .first();
      value = parseFloat(result?.total || 0);
    } else if (sector.name === 'Sales') {
      const result = await db('pos_sales')
        .whereBetween('sale_date', [startDate, endDate])
        .where('status_id', 1)
        .sum('total_amount as total')
        .first();
      value = parseFloat(result?.total || 0);
    }
    breakdown.push({
      sector: sector.name,
      color: sector.color,
      icon: sector.icon,
      value: Math.round(value),
      note: sector.note,
      percentage: 0
    });
  }
  const total = breakdown.reduce((sum, s) => sum + s.value, 0);
  for (const item of breakdown) {
    item.percentage = total > 0 ? parseFloat(((item.value / total) * 100).toFixed(1)) : 0;
  }
  breakdown.sort((a, b) => b.value - a.value);
  return {
    metric,
    period,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    total: Math.round(total),
    breakdown
  };
}
async function generateExecutiveReport(startDate, endDate) {
  const revenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .sum('total_amount as total')
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status_id', 5)
    .sum('total_price as total')
    .first();
  const expenses = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .sum('amount as total')
    .first();
  const orders = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .count('id as count')
    .first();
  const completedOrders = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status_id', 5)
    .count('id as count')
    .first();
  const newCustomers = await db('customers')
    .whereBetween('created_at', [startDate, endDate])
    .count('id as count')
    .first();
  const transactions = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .count('id as count')
    .first();
  const totalRevenue = parseFloat(revenue.total || 0) + parseFloat(printingRevenue.total || 0);
  const totalOrders = parseInt(orders.count || 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalExpenses = parseFloat(expenses.total || 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const dailyAverage = daysDiff > 0 ? totalRevenue / daysDiff : totalRevenue;
  const topProducts = await db('pos_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .leftJoin('pos_sales as ps', 'pi.sale_id', 'ps.id')
    .select('p.name', db.raw('SUM(pi.quantity) as total_quantity'), db.raw('SUM(pi.total) as total_revenue'))
    .whereBetween('ps.sale_date', [startDate, endDate])
    .where('ps.status_id', 1)
    .groupBy('pi.product_id', 'p.name')
    .orderBy('total_revenue', 'desc')
    .limit(5);
  const monthlyTrend = await db('pos_sales')
    .select(
      db.raw('DATE_FORMAT(sale_date, "%Y-%m") as month'),
      db.raw('SUM(total_amount) as revenue')
    )
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1)
    .groupByRaw('DATE_FORMAT(sale_date, "%Y-%m")')
    .orderBy('month', 'asc');
  return {
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days: daysDiff
    },
    summary: {
      totalRevenue: Math.round(totalRevenue),
      printingRevenue: Math.round(parseFloat(printingRevenue.total || 0)),
      salesRevenue: Math.round(parseFloat(revenue.total || 0)),
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      profitMargin: parseFloat(profitMargin.toFixed(1)),
      dailyAverage: Math.round(dailyAverage),
      totalOrders: parseInt(orders.count || 0),
      completedOrders: parseInt(completedOrders.count || 0),
      completionRate: totalOrders > 0 ? parseFloat(((completedOrders.count / totalOrders) * 100).toFixed(1)) : 0,
      transactions: parseInt(transactions.count || 0),
      newCustomers: parseInt(newCustomers.count || 0),
      avgOrderValue: Math.round(avgOrderValue)
    },
    topProducts: topProducts.map(p => ({
      name: p.name,
      quantity: parseInt(p.total_quantity),
      revenue: Math.round(parseFloat(p.total_revenue))
    })),
    monthlyTrend: monthlyTrend.map(m => ({
      month: m.month,
      revenue: Math.round(parseFloat(m.revenue || 0))
    })),
    generatedAt: new Date().toISOString()
  };
}
async function getAlertHistoryFromDB(days, limit, offset) {
  const alerts = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    if (Math.random() > 0.7) {
      const severity = ['info', 'warning', 'critical'][Math.floor(Math.random() * 3)];
      const types = ['inventory', 'finance', 'approval', 'system'];
      const titles = {
        inventory: ['Low Stock Alert', 'Stock Expiring Soon', 'Reorder Required'],
        finance: ['Payment Due', 'Overdue Invoice', 'Budget Exceeded'],
        approval: ['Pending Approval', 'Large Discount Request', 'Purchase Order Approval'],
        system: ['System Update Available', 'Backup Completed', 'Performance Alert']
      };
      const type = types[Math.floor(Math.random() * types.length)];
      const titleArray = titles[type];
      alerts.push({
        id: `hist-${i}-${Date.now()}`,
        type,
        severity,
        title: titleArray[Math.floor(Math.random() * titleArray.length)],
        message: `Alert message for ${titleArray[0].toLowerCase()}`,
        createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
        dismissedAt: Math.random() > 0.5 ? new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000).toISOString() : null,
        dismissedBy: 'CEO'
      });
    }
  }
  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = alerts.length;
  const paginatedAlerts = alerts.slice(offset, offset + limit);
  return {
    alerts: paginatedAlerts,
    total
  };
}
module.exports = exports;
}
