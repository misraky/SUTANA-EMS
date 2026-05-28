const { db } = require('../config/database');
const { AppError } = require('../utils/AppError');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const getDailySalesReport = async (date) => {
  const targetDate = date || new Date().toISOString().split('T')[0];
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
    .whereDate('pos_sales.sale_date', targetDate)
    .where('pos_sales.status', 'Completed')
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
  return { date: targetDate, sales, summary };
};
const getSalesByPeriod = async (startDate, endDate, groupBy = 'day') => {
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
    .where('status', 'Completed')
    .groupByRaw(`DATE_FORMAT(sale_date, '${dateFormat}')`)
    .orderBy('period', 'asc');
  const totals = {
    totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total_revenue), 0),
    totalOrders: sales.reduce((sum, s) => sum + parseInt(s.order_count), 0),
    totalTax: sales.reduce((sum, s) => sum + parseFloat(s.total_tax), 0),
    totalDiscount: sales.reduce((sum, s) => sum + parseFloat(s.total_discount), 0),
    averageOrderValue: sales.length > 0 ? sales.reduce((sum, s) => sum + parseFloat(s.total_revenue), 0) / sales.reduce((sum, s) => sum + parseInt(s.order_count), 0) : 0
  };
  return { startDate, endDate, groupBy, sales, totals };
};
const getSalesByProduct = async (startDate, endDate, page = 1, limit = 50) => {
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
    .where('ps.status', 'Completed')
    .groupBy('pi.product_id', 'p.id', 'p.name', 'p.sku');
  if (startDate && endDate) {
    query = query.whereBetween('ps.sale_date', [startDate, endDate]);
  }
  const total = await query.clone().countDistinct('pi.product_id as total').first();
  const products = await query
    .orderBy('total_revenue', 'desc')
    .limit(limit)
    .offset(offset);
  return {
    products,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getSalesByCustomer = async (startDate, endDate, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  let query = db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .select(
      'c.id',
      'c.name',
      'c.phone',
      'c.email',
      db.raw('COUNT(ps.id) as order_count'),
      db.raw('SUM(ps.total_amount) as total_spent'),
      db.raw('AVG(ps.total_amount) as avg_order_value'),
      db.raw('MAX(ps.sale_date) as last_purchase')
    )
    .where('ps.status', 'Completed')
    .whereNotNull('ps.customer_id')
    .groupBy('ps.customer_id', 'c.id', 'c.name', 'c.phone', 'c.email');
  if (startDate && endDate) {
    query = query.whereBetween('ps.sale_date', [startDate, endDate]);
  }
  const total = await query.clone().countDistinct('ps.customer_id as total').first();
  const customers = await query
    .orderBy('total_spent', 'desc')
    .limit(limit)
    .offset(offset);
  return {
    customers,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getPrintingOrdersReport = async (startDate, endDate, status, customerTypeId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  let query = db('printing_orders as po')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.order_number',
      'c.name as customer_name',
      'ct.name as customer_type',
      'po.product_type',
      'po.quantity',
      'po.paper_type',
      'po.pages_per_copy',
      'po.total_price',
      'os.status_name as status',
      'po.due_date',
      'po.created_at'
    )
    .whereNull('po.deleted_at');
  if (startDate && endDate) {
    query = query.whereBetween('po.created_at', [startDate, endDate]);
  }
  if (status) {
    const statusRecord = await db('order_statuses').where('status_code', status).first();
    if (statusRecord) {
      query = query.where('po.status_id', statusRecord.id);
    }
  }
  if (customerTypeId) {
    query = query.where('po.customer_type_id', customerTypeId);
  }
  const total = await query.clone().count('po.id as total').first();
  const orders = await query
    .orderBy('po.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const summary = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0),
    byStatus: {},
    byProductType: {}
  };
  for (const order of orders) {
    if (!summary.byStatus[order.status]) {
      summary.byStatus[order.status] = { count: 0, revenue: 0 };
    }
    summary.byStatus[order.status].count++;
    summary.byStatus[order.status].revenue += parseFloat(order.total_price);
    if (!summary.byProductType[order.product_type]) {
      summary.byProductType[order.product_type] = { count: 0, revenue: 0 };
    }
    summary.byProductType[order.product_type].count++;
    summary.byProductType[order.product_type].revenue += parseFloat(order.total_price);
  }
  return {
    orders,
    summary,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getPrintingRevenueReport = async (startDate, endDate, groupBy = 'month') => {
  let dateFormat;
  switch (groupBy) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-%u';
      break;
    default:
      dateFormat = '%Y-%m';
  }
  const revenue = await db('printing_orders')
    .select(
      db.raw(`DATE_FORMAT(created_at, '${dateFormat}') as period`),
      db.raw('SUM(total_price) as revenue'),
      db.raw('COUNT(*) as order_count'),
      db.raw('AVG(total_price) as avg_order_value')
    )
    .whereBetween('created_at', [startDate, endDate])
    .where('status', 'Delivered')
    .groupByRaw(`DATE_FORMAT(created_at, '${dateFormat}')`)
    .orderBy('period', 'asc');
  const totals = {
    totalRevenue: revenue.reduce((sum, r) => sum + parseFloat(r.revenue), 0),
    totalOrders: revenue.reduce((sum, r) => sum + parseInt(r.order_count), 0),
    averageOrderValue: revenue.length > 0 ? revenue.reduce((sum, r) => sum + parseFloat(r.revenue), 0) / revenue.reduce((sum, r) => sum + parseInt(r.order_count), 0) : 0
  };
  return { startDate, endDate, groupBy, revenue, totals };
};
const getTaxReceiptReport = async (startDate, endDate, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  let query = db('tax_receipts as tr')
    .leftJoin('printing_orders as po', 'tr.order_id', 'po.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .select(
      'tr.serial_number',
      'po.order_number',
      'c.name as customer_name',
      'tr.approval_amount_total',
      'tr.used_count',
      'tr.remaining',
      'tr.approved_date',
      'tr.printed_at'
    );
  if (startDate && endDate) {
    query = query.whereBetween('tr.printed_at', [startDate, endDate]);
  }
  const total = await query.clone().count('tr.id as total').first();
  const receipts = await query
    .orderBy('tr.printed_at', 'desc')
    .limit(limit)
    .offset(offset);
  const summary = {
    totalReceipts: receipts.length,
    totalApprovedAmount: receipts.reduce((sum, r) => sum + r.approval_amount_total, 0),
    totalUsed: receipts.reduce((sum, r) => sum + r.used_count, 0),
    totalRemaining: receipts.reduce((sum, r) => sum + r.remaining, 0)
  };
  return {
    receipts,
    summary,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getLowStockReport = async (thresholdPercent = 20) => {
  const products = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .select(
      'p.name',
      'p.sku',
      'pc.name as category',
      'p.reorder_level',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, 0) as current_stock'),
      db.raw('ROUND((COALESCE(i.quantity, 0) / NULLIF(p.reorder_level, 0)) * 100, 1) as stock_percentage')
    )
    .whereNull('p.deleted_at')
    .where('p.is_active', true)
    .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level')
    .orderByRaw('(COALESCE(i.quantity, 0) / NULLIF(p.reorder_level, 0)) ASC');
  const critical = products.filter(p => p.stock_percentage < (thresholdPercent / 2));
  const warning = products.filter(p => p.stock_percentage >= (thresholdPercent / 2) && p.stock_percentage < thresholdPercent);
  return {
    products,
    summary: {
      totalLowStock: products.length,
      critical: critical.length,
      warning: warning.length,
      thresholdPercent
    }
  };
};
const getExpiringProductsReport = async (days = 30) => {
  const products = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .select(
      'p.name',
      'p.sku',
      'pc.name as category',
      'p.expiry_date',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, 0) as current_stock'),
      db.raw('DATEDIFF(p.expiry_date, CURDATE()) as days_until_expiry')
    )
    .whereNull('p.deleted_at')
    .where('p.is_active', true)
    .whereNotNull('p.expiry_date')
    .whereRaw('DATEDIFF(p.expiry_date, CURDATE()) <= ?', [days])
    .orderBy('days_until_expiry', 'asc');
  const expiringSoon = products.filter(p => p.days_until_expiry <= 7);
  const expiringLater = products.filter(p => p.days_until_expiry > 7 && p.days_until_expiry <= 30);
  return {
    products,
    summary: {
      totalExpiring: products.length,
      expiringSoon: expiringSoon.length,
      expiringLater: expiringLater.length,
      thresholdDays: days
    }
  };
};
const getInventoryMovementReport = async (productId, transactionType, startDate, endDate, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  let query = db('inventory_movements as im')
    .leftJoin('products as p', 'im.product_id', 'p.id')
    .leftJoin('users as u', 'im.performed_by', 'u.id')
    .select(
      'im.*',
      'p.name as product_name',
      'p.sku',
      'u.full_name as performed_by_name'
    );
  if (productId) {
    query = query.where('im.product_id', productId);
  }
  if (transactionType) {
    query = query.where('im.transaction_type', transactionType);
  }
  if (startDate && endDate) {
    query = query.whereBetween('im.created_at', [startDate, endDate]);
  }
  const total = await query.clone().count('im.id as total').first();
  const movements = await query
    .orderBy('im.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const summary = await db('inventory_movements')
    .where(function() {
      if (productId) this.where('product_id', productId);
      if (startDate && endDate) this.whereBetween('created_at', [startDate, endDate]);
    })
    .select(
      db.raw('SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_in'),
      db.raw('SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_out')
    )
    .first();
  return {
    movements,
    summary: {
      totalIn: parseInt(summary.total_in || 0),
      totalOut: parseInt(summary.total_out || 0),
      netChange: (summary.total_in || 0) - (summary.total_out || 0)
    },
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getInventoryValuationReport = async (asOfDate = null) => {
  const valuation = await db('inventory as i')
    .leftJoin('products as p', 'i.product_id', 'p.id')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .select(
      'pc.name as category',
      db.raw('COUNT(DISTINCT p.id) as product_count'),
      db.raw('SUM(i.quantity) as total_units'),
      db.raw('SUM(i.quantity * i.unit_cost) as total_value')
    )
    .whereNull('p.deleted_at')
    .where('p.is_active', true)
    .groupBy('p.category_id', 'pc.name')
    .orderBy('total_value', 'desc');
  const totalValue = valuation.reduce((sum, v) => sum + parseFloat(v.total_value), 0);
  return {
    asOfDate: asOfDate || new Date().toISOString().split('T')[0],
    valuation,
    totalValue
  };
};
const getProfitAndLoss = async (startDate, endDate, sectorId = null) => {
  let revenueQuery = db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed');
  const revenue = await revenueQuery
    .select(
      db.raw('SUM(total_amount) as total_revenue'),
      db.raw('SUM(tax_amount) as total_tax'),
      db.raw('COUNT(*) as transaction_count')
    )
    .first();
  const printingRevenue = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status', 'Delivered')
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
  return {
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
  };
};
const getBalanceSheet = async (asOfDate = null) => {
  const reportDate = asOfDate || new Date().toISOString().split('T')[0];
  const inventoryValue = await db('inventory as i')
    .leftJoin('products as p', 'i.product_id', 'p.id')
    .whereNull('p.deleted_at')
    .select(db.raw('SUM(i.quantity * i.unit_cost) as total_value'))
    .first();
  const accountsReceivable = await db('customers')
    .sum('current_balance as total')
    .first();
  const cashBalance = await db('payments')
    .where('status', 'Completed')
    .sum('amount as total')
    .first();
  const accountsPayable = await db('purchase_orders')
    .whereRaw('paid_amount < total_amount')
    .select(db.raw('SUM(total_amount - paid_amount) as total'))
    .first();
  const retainedEarnings = await db('pos_sales')
    .where('status', 'Completed')
    .select(db.raw('SUM(total_amount) - (SELECT SUM(amount) FROM expenses WHERE approved_at IS NOT NULL) as total'))
    .first();
  const totalAssets = (parseFloat(inventoryValue.total_value || 0) + 
                       parseFloat(accountsReceivable.total || 0) + 
                       parseFloat(cashBalance.total || 0));
  const totalLiabilities = parseFloat(accountsPayable.total || 0);
  const totalEquity = totalAssets - totalLiabilities;
  return {
    asOfDate: reportDate,
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
  };
};
const getCashFlow = async (startDate, endDate) => {
  const salesReceipts = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .sum('total_amount as total')
    .first();
  const paymentsToSuppliers = await db('purchase_orders')
    .whereBetween('created_at', [startDate, endDate])
    .sum('paid_amount as total')
    .first();
  const operatingExpenses = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .sum('amount as total')
    .first();
  const netCashFromOperations = (parseFloat(salesReceipts.total || 0) - 
                                 parseFloat(paymentsToSuppliers.total || 0) - 
                                 parseFloat(operatingExpenses.total || 0));
  return {
    period: { startDate, endDate },
    operatingActivities: {
      cashInflow: parseFloat(salesReceipts.total || 0),
      cashOutflow: parseFloat(paymentsToSuppliers.total || 0) + parseFloat(operatingExpenses.total || 0),
      netCash: netCashFromOperations
    },
    netCashChange: netCashFromOperations,
    endingCashBalance: netCashFromOperations 
  };
};
const getExpensesReport = async (startDate, endDate, categoryId = null, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  let query = db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .leftJoin('users as u', 'e.entered_by', 'u.id')
    .select(
      'e.*',
      'ec.name as category_name',
      'u.full_name as entered_by_name'
    )
    .whereBetween('e.date', [startDate, endDate])
    .whereNotNull('e.approved_at')
    .whereNull('e.deleted_at');
  if (categoryId) {
    query = query.where('e.category_id', categoryId);
  }
  const total = await query.clone().count('e.id as total').first();
  const expenses = await query
    .orderBy('e.date', 'desc')
    .limit(limit)
    .offset(offset);
  const summary = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .whereNull('deleted_at')
    .select(
      db.raw('SUM(amount) as total_amount'),
      db.raw('COUNT(*) as total_count'),
      db.raw('AVG(amount) as avg_amount')
    )
    .first();
  return {
    expenses,
    summary: {
      totalAmount: parseFloat(summary.total_amount || 0),
      totalCount: parseInt(summary.total_count || 0),
      averageAmount: parseFloat(summary.avg_amount || 0)
    },
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getTaxSummaryReport = async (startDate, endDate) => {
  const vatCollected = await db('pos_sales')
    .whereBetween('sale_date', [startDate, endDate])
    .where('status', 'Completed')
    .sum('tax_amount as total')
    .first();
  const vatPaid = await db('purchase_orders')
    .whereBetween('created_at', [startDate, endDate])
    .sum('tax_amount as total')
    .first();
  const withholdingTax = await db('expenses')
    .whereBetween('date', [startDate, endDate])
    .whereNotNull('approved_at')
    .select(db.raw('SUM(amount * 0.02) as tax')) 
    .first();
  return {
    period: { startDate, endDate },
    vat: {
      collected: parseFloat(vatCollected.total || 0),
      paid: parseFloat(vatPaid.total || 0),
      payable: parseFloat(vatCollected.total || 0) - parseFloat(vatPaid.total || 0)
    },
    withholdingTax: parseFloat(withholdingTax.total || 0),
    totalTaxLiability: (parseFloat(vatCollected.total || 0) - parseFloat(vatPaid.total || 0)) + parseFloat(withholdingTax.total || 0)
  };
};
const getExecutiveSummary = async (period = 'monthly') => {
  const now = new Date();
  let startDate, endDate = now;
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quarterly': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const revenue = await getProfitAndLoss(startDate, endDate);
  const topProducts = await getSalesByProduct(startDate, endDate, 1, 5);
  return {
    period,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    revenue: revenue.revenue.total,
    profit: revenue.netProfit,
    profitMargin: revenue.profitMargin,
    topProducts: topProducts.products.slice(0, 5)
  };
};
const getKPIReport = async (period = 'month') => {
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
  const revenue = await getProfitAndLoss(startDate, endDate);
  const newCustomers = await db('customers')
    .whereBetween('created_at', [startDate, endDate])
    .count('id as count')
    .first();
  const orders = await db('printing_orders')
    .whereBetween('created_at', [startDate, endDate])
    .where('status', 'Delivered')
    .count('id as count')
    .first();
  const avgFulfillment = await db('printing_orders')
    .whereNotNull('completed_at')
    .whereBetween('created_at', [startDate, endDate])
    .select(db.raw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_hours'))
    .first();
  return {
    period,
    financial: {
      totalRevenue: revenue.revenue.total,
      netProfit: revenue.netProfit,
      profitMargin: revenue.profitMargin
    },
    customer: {
      newCustomers: parseInt(newCustomers.count || 0),
      totalOrders: parseInt(orders.count || 0),
      avgFulfillmentHours: parseFloat(avgFulfillment.avg_hours || 0)
    }
  };
};
const getTrendsReport = async (metrics = 'revenue,profit,orders', months = 12) => {
  const metricList = metrics.split(',');
  const trends = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthData = { month: date.toLocaleString('default', { month: 'short', year: 'numeric' }) };
    for (const metric of metricList) {
      switch (metric) {
        case 'revenue': {
          const revenue = await db('pos_sales')
            .whereBetween('sale_date', [startDate, endDate])
            .where('status', 'Completed')
            .sum('total_amount as total')
            .first();
          monthData.revenue = parseFloat(revenue.total || 0);
          break;
        }
        case 'profit': {
          const pnl = await getProfitAndLoss(startDate, endDate);
          monthData.profit = pnl.netProfit;
          break;
        }
        case 'orders': {
          const orders = await db('printing_orders')
            .whereBetween('created_at', [startDate, endDate])
            .count('id as count')
            .first();
          monthData.orders = parseInt(orders.count || 0);
          break;
        }
        case 'customers': {
          const customers = await db('customers')
            .whereBetween('created_at', [startDate, endDate])
            .count('id as count')
            .first();
          monthData.newCustomers = parseInt(customers.count || 0);
          break;
        }
      }
    }
    trends.push(monthData);
  }
  return { metrics: metricList, months, trends };
};
const exportReport = async (reportType, format, params) => {
  let data;
  let filename;
  switch (reportType) {
    case 'sales':
      data = await getSalesByPeriod(params.startDate, params.endDate);
      filename = `sales_report_${params.startDate}_to_${params.endDate}`;
      break;
    case 'inventory':
      data = await getLowStockReport();
      filename = `inventory_report_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'pnl':
      data = await getProfitAndLoss(params.startDate, params.endDate);
      filename = `pnl_${params.startDate}_to_${params.endDate}`;
      break;
    default:
      throw new AppError('Invalid report type', 400);
  }
  if (format === 'csv') {
    return { format: 'csv', data: convertToCSV(data), filename };
  }
  if (format === 'excel') {
    return { format: 'excel', data: await convertToExcel(data, reportType), filename };
  }
  return { format: 'pdf', data: await convertToPDF(data, reportType), filename };
};
const convertToCSV = (data) => {
  const json2csv = require('json2csv').parse;
  const records = data.sales || data.products || data.revenue || [];
  return json2csv(records);
};
const convertToExcel = async (data, reportType) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType.toUpperCase());
  let records = data.sales || data.products || data.revenue || [];
  if (records.length > 0) {
    const columns = Object.keys(records[0]);
    worksheet.columns = columns.map(col => ({ header: col, key: col, width: 20 }));
    worksheet.addRows(records);
    worksheet.getRow(1).font = { bold: true };
  }
  return workbook;
};
const convertToPDF = async (data, reportType) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.fontSize(20).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('Summary', { underline: true });
  doc.moveDown(0.5);
  const summary = data.summary || data.totals || {};
  for (const [key, value] of Object.entries(summary)) {
    doc.fontSize(10).text(`${key}: ${typeof value === 'number' ? value.toLocaleString() : value}`);
  }
  return doc;
};
module.exports = {
  getDailySalesReport,
  getSalesByPeriod,
  getSalesByProduct,
  getSalesByCustomer,
  getPrintingOrdersReport,
  getPrintingRevenueReport,
  getTaxReceiptReport,
  getLowStockReport,
  getExpiringProductsReport,
  getInventoryMovementReport,
  getInventoryValuationReport,
  getProfitAndLoss,
  getBalanceSheet,
  getCashFlow,
  getExpensesReport,
  getTaxSummaryReport,
  getExecutiveSummary,
  getKPIReport,
  getTrendsReport,
  exportReport
};
