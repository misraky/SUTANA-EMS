const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
exports.getDailySalesReport = catchAsync(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  const sales = await db('pos_sales')
    .leftJoin('customers', 'pos_sales.customer_id', 'customers.id')
    .leftJoin('users', 'pos_sales.cashier_id', 'users.id')
    .leftJoin('sale_statuses', 'pos_sales.status_id', 'sale_statuses.id')
    .select(
      'pos_sales.*',
      'customers.name as customer_name',
      'users.full_name as cashier_name',
      'sale_statuses.status_name as status_name'
    )
    .whereRaw('DATE(pos_sales.sale_date) = ?', [date])
    .where('pos_sales.status_id', 1)
    .orderBy('pos_sales.sale_date', 'desc');
  const summary = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
    totalTax: sales.reduce((sum, s) => sum + parseFloat(s.tax_amount), 0),
    totalDiscount: sales.reduce((sum, s) => sum + parseFloat(s.discount_amount), 0),
    averageOrderValue: sales.length > 0 ? sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0) / sales.length : 0,
    byPaymentMethod: {}
  };
  for (const sale of sales) {
    const method = sale.payment_method;
    if (!summary.byPaymentMethod[method]) {
      summary.byPaymentMethod[method] = { count: 0, amount: 0 };
    }
    summary.byPaymentMethod[method].count++;
    summary.byPaymentMethod[method].amount += parseFloat(sale.total_amount);
  }
  res.json({
    status: 'success',
    data: {
      date,
      sales,
      summary
    }
  });
});
exports.getSalesByPeriod = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }
  let dateFormat;
  switch (groupBy) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-%u';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }
  const sales = await db('pos_sales')
    .select(
      db.raw(`DATE_FORMAT(sale_date, '${dateFormat}') as period`),
      db.raw('COUNT(*) as order_count'),
      db.raw('SUM(total_amount) as total_revenue'),
      db.raw('SUM(tax_amount) as total_tax'),
      db.raw('SUM(discount_amount) as total_discount'),
      db.raw('AVG(total_amount) as avg_order_value')
    )
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1) 
    .groupByRaw(`DATE_FORMAT(sale_date, '${dateFormat}')`)
    .orderBy('period', 'asc');
  const totals = {
    totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total_revenue), 0),
    totalOrders: sales.reduce((sum, s) => sum + parseInt(s.order_count), 0),
    totalTax: sales.reduce((sum, s) => sum + parseFloat(s.total_tax), 0),
    totalDiscount: sales.reduce((sum, s) => sum + parseFloat(s.total_discount), 0),
    averageOrderValue: sales.length > 0 ? sales.reduce((sum, s) => sum + parseFloat(s.total_revenue), 0) / sales.reduce((sum, s) => sum + parseInt(s.order_count), 0) : 0
  };
  res.json({
    status: 'success',
    data: {
      startDate,
      endDate,
      groupBy,
      sales,
      totals
    }
  });
});
exports.getSalesByProduct = catchAsync(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  let query = db('pos_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .leftJoin('pos_sales as ps', 'pi.sale_id', 'ps.id')
    .select(
      'p.id',
      'p.name',
      'p.sku',
      db.raw('SUM(pi.quantity) as total_quantity'),
      db.raw('SUM(pi.total) as total_revenue'),
      db.raw('AVG(pi.unit_price) as avg_price'),
      db.raw('COUNT(DISTINCT pi.sale_id) as order_count')
    )
    .where('ps.status_id', 1) 
    .groupBy('pi.product_id', 'p.id', 'p.name', 'p.sku');
  if (startDate && endDate) {
    query = query.whereBetween('ps.sale_date', [startDate, endDate]);
  }
  const total = await query.clone().countDistinct('pi.product_id as total').first();
  const products = await query
    .orderBy('total_revenue', 'desc')
    .limit(limit)
    .offset(offset);
  res.json({
    status: 'success',
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getProfitAndLoss = catchAsync(async (req, res) => {
  const { startDate, endDate, sectorId } = req.query;
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }
  let revenueQuery = db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1); 
  if (sectorId) {
  }
  const revenue = await revenueQuery
    .select(
      db.raw('SUM(total_amount) as total_revenue'),
      db.raw('SUM(tax_amount) as total_tax'),
      db.raw('COUNT(*) as transaction_count')
    )
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status_id', 5)
    .sum('total_price as total')
    .first();
  const cogs = await db('inventory_movements')
    .whereBetween('created_at', [startDate, endDate])
    .where('transaction_type', 'Sale')
    .select(db.raw('SUM(ABS(quantity_change) * (SELECT unit_cost FROM inventory WHERE product_id = inventory_movements.product_id)) as total_cogs'))
    .first();
  const expenses = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .sum('amount as total')
    .first();
  const totalRevenue = (parseFloat(revenue.total_revenue || 0) + parseFloat(printingRevenue.total || 0));
  const totalExpenses = parseFloat(expenses.total || 0);
  const totalCogs = parseFloat(cogs.total_cogs || 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  res.json({
    status: 'success',
    data: {
      period: { startDate, endDate },
      revenue: {
        sales: parseFloat(revenue.total_revenue || 0),
        printing: parseFloat(printingRevenue.total || 0),
        total: totalRevenue
      },
      costOfGoodsSold: totalCogs,
      grossProfit,
      operatingExpenses: totalExpenses,
      netProfit,
      profitMargin: profitMargin.toFixed(2),
      taxCollected: parseFloat(revenue.total_tax || 0)
    }
  });
});
exports.getBalanceSheet = catchAsync(async (req, res) => {
  const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;
  const inventoryValue = await db('inventory as i')
    .leftJoin('products as p', 'i.product_id', 'p.id')
    .whereNull('p.deleted_at')
    .select(db.raw('SUM(i.quantity * i.unit_cost) as total_value'))
    .first();
  const accountsReceivable = await db('customers')
    .sum('current_balance as total')
    .first();
  const cashBalance = await db('payments')
    .where('status_id', 1) 
    .sum('amount as total')
    .first();
  const accountsPayable = await db('purchase_orders')
    .whereRaw('paid_amount < total_amount')
    .select(db.raw('SUM(total_amount - paid_amount) as total'))
    .first();
  const retainedEarnings = await db('pos_sales')
    .where('status_id', 1) 
    .select(db.raw('SUM(total_amount) - (SELECT SUM(amount) FROM expenses WHERE approved_at IS NOT NULL) as total'))
    .first();
  const totalAssets = (parseFloat(inventoryValue.total_value || 0) + 
                       parseFloat(accountsReceivable.total || 0) + 
                       parseFloat(cashBalance.total || 0));
  const totalLiabilities = parseFloat(accountsPayable.total || 0);
  const totalEquity = totalAssets - totalLiabilities;
  res.json({
    status: 'success',
    data: {
      asOfDate,
      assets: {
        inventory: parseFloat(inventoryValue.total_value || 0),
        accountsReceivable: parseFloat(accountsReceivable.total || 0),
        cash: parseFloat(cashBalance.total || 0),
        total: totalAssets
      },
      liabilities: {
        accountsPayable: parseFloat(accountsPayable.total || 0),
        total: totalLiabilities
      },
      equity: {
        retainedEarnings: parseFloat(retainedEarnings.total || 0),
        total: totalEquity
      }
    }
  });
});
exports.exportReport = catchAsync(async (req, res) => {
  const { reportType } = req.params;
  const { format, startDate, endDate } = req.query;
  const userId = req.user.id;
  const ip = req.ip;
  let reportData;
  let filename;
  switch (reportType) {
    case 'sales':
      reportData = await exports.getSalesByPeriodData(startDate, endDate);
      filename = `sales_report_${startDate}_to_${endDate}`;
      break;
    case 'inventory':
      reportData = await exports.getInventoryReportData();
      filename = `inventory_report_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'pnl':
      reportData = await exports.getProfitAndLossData(startDate, endDate);
      filename = `pnl_${startDate}_to_${endDate}`;
      break;
    default:
      throw new AppError('Invalid report type', 400);
  }
  await audit('REPORT_EXPORTED', userId, {
    ip,
    details: { reportType, format, dateRange: { startDate, endDate } }
  });
  if (format === 'csv') {
    const json2csv = require('json2csv').parse;
    const csv = json2csv(reportData.data);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${filename}.csv`);
    return res.send(csv);
  }
  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportType.toUpperCase());
    if (reportData.data.length > 0) {
      const columns = Object.keys(reportData.data[0]);
      worksheet.columns = columns.map(col => ({ header: col, key: col, width: 20 }));
      worksheet.addRows(reportData.data);
      worksheet.getRow(1).font = { bold: true };
    }
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`${filename}.xlsx`);
    await workbook.xlsx.write(res);
    return res.end();
  }
  const doc = new PDFDocument({ margin: 50 });
  res.header('Content-Type', 'application/pdf');
  res.attachment(`${filename}.pdf`);
  doc.pipe(res);
  doc.fontSize(20).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  if (startDate && endDate) {
    doc.text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
  }
  doc.moveDown();
  if (reportData.summary) {
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    for (const [key, value] of Object.entries(reportData.summary)) {
      doc.fontSize(10).text(`${key}: ${typeof value === 'number' ? value.toLocaleString() : value}`);
    }
    doc.moveDown();
  }
  if (reportData.data && reportData.data.length > 0) {
    doc.fontSize(14).text('Details', { underline: true });
    doc.moveDown(0.5);
    const tableTop = doc.y;
    const columns = Object.keys(reportData.data[0]);
    const colWidth = (doc.page.width - 100) / columns.length;
    doc.font('Helvetica-Bold');
    columns.forEach((col, i) => {
      doc.text(col.toUpperCase(), 50 + (i * colWidth), tableTop, { width: colWidth, align: 'left' });
    });
    let y = tableTop + 20;
    doc.font('Helvetica');
    for (const row of reportData.data.slice(0, 50)) {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }
      columns.forEach((col, i) => {
        doc.text(String(row[col] || ''), 50 + (i * colWidth), y, { width: colWidth, align: 'left' });
      });
      y += 20;
    }
    if (reportData.data.length > 50) {
      doc.text(`... and ${reportData.data.length - 50} more rows`, 50, y + 10);
    }
  }
  doc.end();
});
exports.getSalesByPeriodData = async (startDate, endDate) => {
  const sales = await db('pos_sales')
    .leftJoin('customers', 'pos_sales.customer_id', 'customers.id')
    .select(
      'pos_sales.invoice_number',
      'pos_sales.sale_date',
      'customers.name as customer_name',
      'pos_sales.subtotal',
      'pos_sales.tax_amount',
      'pos_sales.discount_amount',
      'pos_sales.total_amount',
      'pos_sales.payment_method'
    )
    .whereBetween('sale_date', [startDate, endDate])
    .where('status_id', 1) 
    .orderBy('sale_date', 'desc');
  const totals = {
    totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
    totalOrders: sales.length,
    totalTax: sales.reduce((sum, s) => sum + parseFloat(s.tax_amount), 0)
  };
  return { data: sales, summary: totals };
};
exports.getInventoryReportData = async () => {
  const products = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .select(
      'p.name',
      'p.sku',
      'pc.name as category',
      db.raw('COALESCE(i.quantity, 0) as current_stock'),
      'p.reorder_level',
      'p.selling_price'
    )
    .whereNull('p.deleted_at');
  const summary = {
    totalProducts: products.length,
    totalStockValue: products.reduce((sum, p) => sum + (p.current_stock * p.selling_price), 0),
    lowStockCount: products.filter(p => p.current_stock <= p.reorder_level).length
  };
  return { data: products, summary };
};
exports.getProfitAndLossData = async (startDate, endDate) => {
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
  const revenueAmount = parseFloat(revenue.total || 0);
  const expenseAmount = parseFloat(expenses.total || 0);
  const data = [{
    category: 'Revenue',
    amount: revenueAmount
  }, {
    category: 'Expenses',
    amount: expenseAmount
  }, {
    category: 'Net Profit',
    amount: revenueAmount - expenseAmount
  }];
  const summary = {
    totalRevenue: revenueAmount,
    totalExpenses: expenseAmount,
    netProfit: revenueAmount - expenseAmount,
    profitMargin: revenueAmount > 0 ? ((revenueAmount - expenseAmount) / revenueAmount * 100).toFixed(2) : 0
  };
  return { data, summary };
};
exports.getWeeklySalesReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { sales: [] } });
});
exports.getMonthlySalesReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { sales: [] } });
});
exports.getSalesByCustomer = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { customers: [] } });
});
exports.getPrintingOrdersReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { orders: [] } });
});
exports.getPrintingRevenueReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { revenue: [] } });
});
exports.getTaxReceiptReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { receipts: [] } });
});
exports.getLowStockReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { products: [] } });
});
exports.getExpiringProductsReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { products: [] } });
});
exports.getInventoryMovementReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { movements: [] } });
});
exports.getInventoryValuationReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { valuation: [] } });
});
exports.getCashFlow = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { cashFlow: [] } });
});
exports.getExpensesReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { expenses: [] } });
});
exports.getTaxSummaryReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { taxSummary: [] } });
});
exports.getExecutiveSummary = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { summary: {} } });
});
exports.getKPIReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { kpis: [] } });
});
exports.getTrendsReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { trends: [] } });
});
exports.scheduleReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Report scheduled' });
});
exports.getScheduledReports = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { scheduledReports: [] } });
});
exports.cancelScheduledReport = catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Scheduled report cancelled' });
});
