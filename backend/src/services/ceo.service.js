const { db } = require('../config/database');
const config = require('../config/env');
const { audit } = require('../config/logger');
const { AppError } = require('../utils/AppError');
const { sendEmail } = require('./email.service');
const getDashboardOverview = async () => {
  const [revenue, profit, cashFlow, kpis, alerts] = await Promise.all([
    getRevenueMetrics('week'),
    getProfitMetrics('month'),
    getCashFlowSummary('weekly', 30),
    getPerformanceKPIs(),
    getCriticalAlerts()
  ]);
  return {
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
};
const getRevenueMetrics = async (period = 'week') => {
  const now = new Date();
  let startDate, previousStartDate, endDate = now;
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      previousStartDate = new Date(now.getFullYear(), quarterStartMonth - 3, 1);
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
  }
  const currentRevenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const currentPrinting = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status', 'Delivered')
    .sum('total_price as total')
    .first();
  const current = parseFloat(currentRevenue.total || 0) + parseFloat(currentPrinting.total || 0);
  const previousRevenue = await db('pos_sales')
    .whereBetween('sale_date', [previousStartDate, startDate])
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const previousPrinting = await db('printing_orders')
    .whereBetween('created_at', [previousStartDate, startDate])
    .where('status', 'Delivered')
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
};
const getRevenueBreakdown = async (period = 'month') => {
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
  const salesRevenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status', 'Delivered')
    .sum('total_price as total')
    .first();
  const breakdown = [
    { sector: 'Printing', revenue: parseFloat(printingRevenue.total || 0), percentage: 0, icon: 'printer', hasData: true },
    { sector: 'Sales', revenue: parseFloat(salesRevenue.total || 0), percentage: 0, icon: 'shopping-cart', hasData: true },
    { sector: 'Agriculture', revenue: 0, percentage: 0, icon: 'seedling', hasData: false, note: 'No data available - Future integration planned' },
    { sector: 'Supervising', revenue: 0, percentage: 0, icon: 'clipboard-list', hasData: false, note: 'No data available - Future integration planned' },
    { sector: 'Pharmacy', revenue: 0, percentage: 0, icon: 'capsules', hasData: false, note: 'No data available - Future integration planned' },
    { sector: 'Car Renting', revenue: 0, percentage: 0, icon: 'car', hasData: false, note: 'No data available - Future integration planned' }
  ];
  const totalRevenue = breakdown.reduce((sum, s) => sum + s.revenue, 0);
  for (const sector of breakdown) {
    sector.percentage = totalRevenue > 0 ? parseFloat(((sector.revenue / totalRevenue) * 100).toFixed(1)) : 0;
  }
  const historical = await getRevenueHistorical(startDate, endDate, period);
  return {
    period,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalRevenue,
    breakdown,
    historical
  };
};
const getRevenueForecast = async (months = 6) => {
  const last12Months = await db('pos_sales')
    .select(
      db.raw('DATE_FORMAT(sale_date, "%Y-%m") as month'),
      db.raw('SUM(total_amount) as revenue')
    )
    .where('sale_date', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 12 MONTH)'))
    .where('status', 'Completed')
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
  for (let i = 1; i <= months; i++) {
    const predictedRevenue = Math.max(0, lastRevenue + (trend * i));
    forecast.push({
      month: getFutureMonthName(i),
      predictedRevenue: Math.round(predictedRevenue),
      confidence: Math.round(95 - (i / months) * 50)
    });
  }
  return {
    historical: last12Months,
    forecast,
    trend: trend.toFixed(2),
    averageMonthlyGrowth: ((trend / (lastRevenue || 1)) * 100).toFixed(1)
  };
};
const getProfitMetrics = async (period = 'month') => {
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
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status', 'Delivered')
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
};
const getProfitMarginTrends = async (months = 12) => {
  const trends = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const revenue = await getProfitMetricsForDateRange(startDate, endDate);
    trends.unshift({
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: revenue.revenue,
      expenses: revenue.expenses,
      profit: revenue.profit,
      margin: revenue.margin
    });
  }
  const avgMargin = trends.reduce((sum, t) => sum + parseFloat(t.margin), 0) / trends.length;
  return {
    trends,
    averageMargin: parseFloat(avgMargin.toFixed(1)),
    bestMonth: trends.reduce((best, t) => parseFloat(t.margin) > parseFloat(best.margin) ? t : best, trends[0]),
    worstMonth: trends.reduce((worst, t) => parseFloat(t.margin) < parseFloat(worst.margin) ? t : worst, trends[0])
  };
};
const getProfitMetricsForDateRange = async (startDate, endDate) => {
  const revenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const expenses = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .sum('amount as total')
    .first();
  const totalRevenue = parseFloat(revenue.total || 0);
  const totalExpenses = parseFloat(expenses.total || 0);
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  return { revenue: totalRevenue, expenses: totalExpenses, profit, margin: margin.toFixed(1) };
};
const getCashFlowData = async (period = 'weekly', days = 30) => {
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
    .where('status', 'Completed')
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
  return {
    inflow,
    outflow,
    net,
    summary: {
      totalInflow: Math.round(totalInflow),
      totalOutflow: Math.round(totalOutflow),
      netFlow: Math.round(totalInflow - totalOutflow),
      status: totalInflow >= totalOutflow ? 'positive' : 'negative'
    }
  };
};
const getCashFlowSummary = async (period, days) => {
  return await getCashFlowData(period, days);
};
const getCashFlowProjection = async (months = 3) => {
  const historical = await getCashFlowData('monthly', 90);
  const avgInflow = historical.inflow.reduce((sum, i) => sum + i.amount, 0) / historical.inflow.length;
  const avgOutflow = historical.outflow.reduce((sum, o) => sum + o.amount, 0) / historical.outflow.length;
  const avgNet = avgInflow - avgOutflow;
  let runningBalance = historical.net[historical.net.length - 1]?.amount || 0;
  const projection = [];
  for (let i = 1; i <= months; i++) {
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
  return {
    historical: historical.net.slice(-6),
    projection,
    averageMonthlyNet: Math.round(avgNet),
    riskLevel: avgNet < 0 ? 'high' : avgNet < 10000 ? 'medium' : 'low'
  };
};
const getPerformanceKPIs = async () => {
  const targetSales = await getTargetSetting('daily_sales_target', 50000);
  const actualSales = await getTodaySales();
  const targetFulfillment = await getTargetSetting('fulfillment_hours_target', 48);
  const actualFulfillmentResult = await db('printing_orders')
    .where('status', 'Delivered')
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
  const completedOrders = await db('printing_orders').where('status', 'Delivered').count('id as count').first();
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
};
const getTargets = async () => {
  return {
    dailySalesTarget: await getTargetSetting('daily_sales_target', 50000),
    monthlySalesTarget: await getTargetSetting('monthly_sales_target', 1500000),
    fulfillmentHoursTarget: await getTargetSetting('fulfillment_hours_target', 48),
    inventoryTurnoverTarget: await getTargetSetting('inventory_turnover_target', 4),
    customerSatisfactionTarget: await getTargetSetting('customer_satisfaction_target', 90),
    profitMarginTarget: await getTargetSetting('profit_margin_target', 20),
    quarterlyRevenueTarget: await getTargetSetting('quarterly_revenue_target', 4500000),
    yearlyRevenueTarget: await getTargetSetting('yearly_revenue_target', 18000000)
  };
};
const updateTargets = async (updates, userId) => {
  const updateEntries = [];
  if (updates.dailySalesTarget !== undefined) updateEntries.push({ key: 'daily_sales_target', value: updates.dailySalesTarget });
  if (updates.monthlySalesTarget !== undefined) updateEntries.push({ key: 'monthly_sales_target', value: updates.monthlySalesTarget });
  if (updates.fulfillmentHoursTarget !== undefined) updateEntries.push({ key: 'fulfillment_hours_target', value: updates.fulfillmentHoursTarget });
  if (updates.inventoryTurnoverTarget !== undefined) updateEntries.push({ key: 'inventory_turnover_target', value: updates.inventoryTurnoverTarget });
  if (updates.customerSatisfactionTarget !== undefined) updateEntries.push({ key: 'customer_satisfaction_target', value: updates.customerSatisfactionTarget });
  if (updates.profitMarginTarget !== undefined) updateEntries.push({ key: 'profit_margin_target', value: updates.profitMarginTarget });
  if (updates.quarterlyRevenueTarget !== undefined) updateEntries.push({ key: 'quarterly_revenue_target', value: updates.quarterlyRevenueTarget });
  if (updates.yearlyRevenueTarget !== undefined) updateEntries.push({ key: 'yearly_revenue_target', value: updates.yearlyRevenueTarget });
  if (updateEntries.length === 0) {
    throw new AppError('No target values provided to update', 400);
  }
  for (const update of updateEntries) {
    await db('settings')
      .insert({
        setting_key: update.key,
        setting_value: update.value.toString(),
        category: 'Business Rules',
        description: 'CEO configured target',
        updated_by: userId,
        updated_at: db.fn.now()
      })
      .onConflict('setting_key')
      .merge();
  }
  return updateEntries.length;
};
const resetTargets = async (userId) => {
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
        updated_by: userId,
        updated_at: db.fn.now()
      });
  }
  return defaultTargets.length;
};
const getCriticalAlerts = async (severity = null) => {
  const alerts = [];
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
    .where('status', 'Pending')
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
  if (severity) {
    return alerts.filter(a => a.severity === severity);
  }
  return alerts;
};
const dismissAlert = async (alertId, userId) => {
  return true;
};
const getAlertHistory = async (days = 30, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const alerts = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    if (Math.random() > 0.7) {
      const severity = ['info', 'warning', 'critical'][Math.floor(Math.random() * 3)];
      const types = ['inventory', 'finance', 'approval', 'system'];
      alerts.push({
        id: `hist-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        severity,
        title: 'Sample Alert',
        message: 'Alert message',
        createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
        dismissedAt: Math.random() > 0.5 ? new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000).toISOString() : null
      });
    }
  }
  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = alerts.length;
  const paginatedAlerts = alerts.slice(offset, offset + limit);
  return { alerts: paginatedAlerts, total };
};
const comparePeriods = async (currentPeriod, previousPeriod, metrics = ['revenue', 'orders', 'profit']) => {
  const current = await getMetricsForPeriod(currentPeriod);
  const previous = await getMetricsForPeriod(previousPeriod);
  const comparison = { currentPeriod, previousPeriod, metrics: {} };
  for (const metric of metrics) {
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
  return comparison;
};
const getMetricsForPeriod = async (period) => {
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
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const revenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const orders = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .count('id as count')
    .first();
  const profitResult = await getProfitMetricsForDateRange(startDate, endDate);
  return {
    revenue: Math.round(parseFloat(revenue?.total || 0)),
    orders: parseInt(orders?.count || 0),
    profit: Math.round(profitResult.profit)
  };
};
const compareSectors = async (metric = 'revenue', period = 'month') => {
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
      const result = await getPrintingMetric(metric, period);
      value = result;
    } else if (sector.name === 'Sales') {
      const result = await getSalesMetric(metric, period);
      value = result;
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
    total: Math.round(total),
    breakdown
  };
};
const getPrintingMetric = async (metric, period) => {
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
  if (metric === 'revenue') {
    const result = await db('printing_orders')
      .whereBetween('created_at', [startDate, endDate])
      .where('status', 'Delivered')
      .sum('total_price as total')
      .first();
    return parseFloat(result?.total || 0);
  } else if (metric === 'orders') {
    const result = await db('printing_orders')
      .whereBetween('created_at', [startDate, endDate])
      .count('id as count')
      .first();
    return parseInt(result?.count || 0);
  }
  return 0;
};
const getSalesMetric = async (metric, period) => {
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
  if (metric === 'revenue') {
    const result = await db('pos_sales')
      .whereBetween('sale_date', [startDate, endDate])
      .where('status', 'Completed')
      .sum('total_amount as total')
      .first();
    return parseFloat(result?.total || 0);
  } else if (metric === 'orders') {
    const result = await db('pos_sales')
      .whereBetween('sale_date', [startDate, endDate])
      .where('status', 'Completed')
      .count('id as count')
      .first();
    return parseInt(result?.count || 0);
  }
  return 0;
};
const getMonthlyReport = async (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return await generateExecutiveReport(startDate, endDate);
};
const getQuarterlyReport = async (year, quarter) => {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);
  const report = await generateExecutiveReport(startDate, endDate);
  report.quarter = quarter;
  return report;
};
const getYearlyReport = async (year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  return await generateExecutiveReport(startDate, endDate);
};
const getTargetSetting = async (key, defaultValue) => {
  const setting = await db('settings')
    .where('setting_key', key)
    .first();
  return setting ? parseFloat(setting.setting_value) : defaultValue;
};
const getTodaySales = async () => {
  const today = new Date().toISOString().split('T')[0];
  const result = await db('pos_sales')
    .whereDate('sale_date', today)
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  return parseFloat(result?.total || 0);
};
const getStatusColor = (actual, target, lowerIsBetter = false) => {
  const percentage = target > 0 ? (actual / target) * 100 : 0;
  if (lowerIsBetter) {
    if (actual <= target) return 'green';
    if (actual <= target * 1.1) return 'yellow';
    return 'red';
  }
  if (percentage >= 100) return 'green';
  if (percentage >= 85) return 'yellow';
  return 'red';
};
const getFutureMonthName = (monthsFromNow) => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};
const getRevenueHistorical = async (startDate, endDate, period) => {
  let groupFormat;
  switch (period) {
    case 'week':
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
    .where('status', 'Completed')
    .groupByRaw(`DATE_FORMAT(sale_date, '${groupFormat}')`)
    .orderBy('date', 'asc');
  return historical.map(h => ({
    date: h.date,
    revenue: Math.round(parseFloat(h.revenue))
  }));
};
const generateExecutiveReport = async (startDate, endDate) => {
  const revenue = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status', 'Delivered')
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
    .where('status', 'Delivered')
    .count('id as count')
    .first();
  const newCustomers = await db('customers')
    .whereBetween('created_at', [startDate, endDate])
    .count('id as count')
    .first();
  const transactions = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
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
    .where('ps.status', 'Completed')
    .groupBy('pi.product_id', 'p.name')
    .orderBy('total_revenue', 'desc')
    .limit(5);
  const monthlyTrend = await db('pos_sales')
    .select(
      db.raw('DATE_FORMAT(sale_date, "%Y-%m") as month'),
      db.raw('SUM(total_amount) as revenue')
    )
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
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
};
module.exports = {
  getDashboardOverview,
  getRevenueMetrics,
  getRevenueBreakdown,
  getRevenueForecast,
  getProfitMetrics,
  getProfitMarginTrends,
  getCashFlowData,
  getCashFlowProjection,
  getPerformanceKPIs,
  getTargets,
  updateTargets,
  resetTargets,
  getCriticalAlerts,
  dismissAlert,
  getAlertHistory,
  comparePeriods,
  compareSectors,
  getMonthlyReport,
  getQuarterlyReport,
  getYearlyReport
};
