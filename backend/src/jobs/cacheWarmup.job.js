const cron = require('node-cron');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const config = require('../config/env');
const JOB_CONFIG = {
  schedule: '0 */6 * * *', 
  name: 'cache-warmup',
  enabled: true
};
let scheduledTask = null;
const CACHE_TTL = {
  settings: 3600,      
  categories: 3600,    
  units: 3600,         
  customerTypes: 3600, 
  paymentMethods: 3600, 
  roles: 3600,         
  departments: 3600,   
  topProducts: 1800,   
  dashboardStats: 300, 
  recentOrders: 300    
};
const warmupSettings = async () => {
  try {
    const settings = await db('settings').select('*');
    for (const setting of settings) {
    }
    logger.info(`[Cache Warmup] Cached ${settings.length} system settings`);
    return settings.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup settings:', error.message);
    return 0;
  }
};
const warmupCategories = async () => {
  try {
    const categories = await db('product_categories')
      .select('id', 'name', 'is_active')
      .orderBy('name');
    logger.info(`[Cache Warmup] Cached ${categories.length} product categories`);
    return categories.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup categories:', error.message);
    return 0;
  }
};
const warmupUnits = async () => {
  try {
    const units = await db('units')
      .select('id', 'name', 'abbreviation')
      .orderBy('name');
    logger.info(`[Cache Warmup] Cached ${units.length} units`);
    return units.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup units:', error.message);
    return 0;
  }
};
const warmupCustomerTypes = async () => {
  try {
    const customerTypes = await db('customer_types')
      .select('id', 'name', 'color_code', 'icon_name', 'sort_order')
      .orderBy('sort_order');
    logger.info(`[Cache Warmup] Cached ${customerTypes.length} customer types`);
    return customerTypes.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup customer types:', error.message);
    return 0;
  }
};
const warmupPaymentMethods = async () => {
  try {
    const paymentMethods = await db('payment_methods')
      .select('id', 'name', 'requires_reference', 'is_active')
      .where('is_active', true);
    logger.info(`[Cache Warmup] Cached ${paymentMethods.length} payment methods`);
    return paymentMethods.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup payment methods:', error.message);
    return 0;
  }
};
const warmupRoles = async () => {
  try {
    const roles = await db('roles')
      .select('id', 'name', 'description', 'permissions');
    logger.info(`[Cache Warmup] Cached ${roles.length} roles`);
    return roles.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup roles:', error.message);
    return 0;
  }
};
const warmupDepartments = async () => {
  try {
    const departments = await db('departments')
      .select('id', 'name', 'description');
    logger.info(`[Cache Warmup] Cached ${departments.length} departments`);
    return departments.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup departments:', error.message);
    return 0;
  }
};
const warmupTopProducts = async () => {
  try {
    const topProducts = await db('pos_items as pi')
      .leftJoin('products as p', 'pi.product_id', 'p.id')
      .leftJoin('pos_sales as ps', 'pi.sale_id', 'ps.id')
      .select(
        'p.id',
        'p.name',
        'p.sku',
        db.raw('SUM(pi.quantity) as total_quantity'),
        db.raw('SUM(pi.total) as total_revenue')
      )
      .where('ps.status', 'Completed')
      .where('ps.sale_date', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
      .groupBy('pi.product_id', 'p.id', 'p.name', 'p.sku')
      .orderBy('total_revenue', 'desc')
      .limit(20);
    logger.info(`[Cache Warmup] Cached ${topProducts.length} top selling products`);
    return topProducts.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup top products:', error.message);
    return 0;
  }
};
const warmupRecentOrders = async () => {
  try {
    const recentOrders = await db('printing_orders as po')
      .leftJoin('customers as c', 'po.customer_id', 'c.id')
      .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
      .select(
        'po.id',
        'po.order_number',
        'c.name as customer_name',
        'po.total_price',
        'os.status_name as status',
        'po.created_at'
      )
      .orderBy('po.created_at', 'desc')
      .limit(50);
    logger.info(`[Cache Warmup] Cached ${recentOrders.length} recent orders`);
    return recentOrders.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup recent orders:', error.message);
    return 0;
  }
};
const warmupDashboardStats = async () => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      totalRevenue,
      pendingOrders
    ] = await Promise.all([
      db('products').whereNull('deleted_at').where('is_active', true).count('id as count').first(),
      db('customers').whereNull('deleted_at').count('id as count').first(),
      db('printing_orders').whereNull('deleted_at').count('id as count').first(),
      db('printing_orders').whereNull('deleted_at').sum('total_price as total').first(),
      db('printing_orders')
        .leftJoin('order_statuses', 'printing_orders.status_id', 'order_statuses.id')
        .whereNot('order_statuses.status_code', 'delivered')
        .whereNull('printing_orders.deleted_at')
        .count('printing_orders.id as count')
        .first()
    ]);
    const dashboardStats = {
      totalProducts: parseInt(totalProducts?.count || 0),
      totalCustomers: parseInt(totalCustomers?.count || 0),
      totalOrders: parseInt(totalOrders?.count || 0),
      totalRevenue: parseFloat(totalRevenue?.total || 0),
      pendingOrders: parseInt(pendingOrders?.count || 0),
      updatedAt: new Date().toISOString()
    };
    logger.info('[Cache Warmup] Cached dashboard statistics');
    return 1;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup dashboard stats:', error.message);
    return 0;
  }
};
const warmupFrequentProducts = async () => {
  try {
    const productIds = await db('pos_items as pi')
      .leftJoin('pos_sales as ps', 'pi.sale_id', 'ps.id')
      .where('ps.status', 'Completed')
      .where('ps.sale_date', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
      .select('pi.product_id')
      .groupBy('pi.product_id')
      .orderByRaw('COUNT(*) DESC')
      .limit(100);
    let cached = 0;
    for (const { product_id } of productIds) {
      const product = await db('products as p')
        .leftJoin('inventory as i', 'p.id', 'i.product_id')
        .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
        .leftJoin('units as u', 'p.unit_id', 'u.id')
        .select(
          'p.*',
          'pc.name as category_name',
          'u.name as unit_name',
          'u.abbreviation as unit_abbr',
          db.raw('COALESCE(i.quantity, 0) as current_stock')
        )
        .where('p.id', product_id)
        .first();
      if (product) {
        cached++;
      }
    }
    logger.info(`[Cache Warmup] Cached ${cached} frequently accessed products`);
    return cached;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup frequent products:', error.message);
    return 0;
  }
};
const warmupSuppliers = async () => {
  try {
    const suppliers = await db('suppliers')
      .where('is_active', true)
      .whereNull('deleted_at')
      .select('id', 'name', 'contact_person', 'phone', 'email');
    logger.info(`[Cache Warmup] Cached ${suppliers.length} active suppliers`);
    return suppliers.length;
  } catch (error) {
    logger.error('[Cache Warmup] Failed to warmup suppliers:', error.message);
    return 0;
  }
};
const executeWarmup = async () => {
  const startTime = Date.now();
  logger.info('[Cache Warmup] Starting cache warmup...');
  const results = {
    settings: 0,
    categories: 0,
    units: 0,
    customerTypes: 0,
    paymentMethods: 0,
    roles: 0,
    departments: 0,
    topProducts: 0,
    recentOrders: 0,
    dashboardStats: 0,
    frequentProducts: 0,
    suppliers: 0
  };
  try {
    const [
      settings,
      categories,
      units,
      customerTypes,
      paymentMethods,
      roles,
      departments,
      topProducts,
      recentOrders,
      dashboardStats,
      frequentProducts,
      suppliers
    ] = await Promise.all([
      warmupSettings(),
      warmupCategories(),
      warmupUnits(),
      warmupCustomerTypes(),
      warmupPaymentMethods(),
      warmupRoles(),
      warmupDepartments(),
      warmupTopProducts(),
      warmupRecentOrders(),
      warmupDashboardStats(),
      warmupFrequentProducts(),
      warmupSuppliers()
    ]);
    results.settings = settings;
    results.categories = categories;
    results.units = units;
    results.customerTypes = customerTypes;
    results.paymentMethods = paymentMethods;
    results.roles = roles;
    results.departments = departments;
    results.topProducts = topProducts;
    results.recentOrders = recentOrders;
    results.dashboardStats = dashboardStats;
    results.frequentProducts = frequentProducts;
    results.suppliers = suppliers;
    const totalCached = Object.values(results).reduce((sum, val) => sum + val, 0);
    const duration = Date.now() - startTime;
    logger.info('[Cache Warmup] Cache warmup completed', {
      ...results,
      totalCached,
      duration: `${duration}ms`
    });
    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[Cache Warmup] Cache warmup failed:', {
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
};
const init = () => {
  if (JOB_CONFIG.enabled) {
    setTimeout(() => {
      executeWarmup().catch(err => {
        logger.error('[Cache Warmup] Initial warmup failed:', err.message);
      });
    }, 5000); 
  }
  if (!JOB_CONFIG.enabled) {
    logger.info('[Cache Warmup] Disabled by configuration');
    return;
  }
  if (scheduledTask) {
    logger.warn('[Cache Warmup] Already initialized');
    return;
  }
  scheduledTask = cron.schedule(JOB_CONFIG.schedule, async () => {
    await executeWarmup();
  }, {
    scheduled: true,
    timezone: config.timezone || 'Africa/Addis_Ababa'
  });
  logger.info(`[Cache Warmup] Initialized with schedule: ${JOB_CONFIG.schedule}`);
  logger.info(`[Cache Warmup] Next execution: ${scheduledTask.nextDates().toISOString()}`);
};
const stop = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('[Cache Warmup] Stopped');
  }
};
const runNow = async () => {
  logger.info('[Cache Warmup] Manual execution triggered');
  return await executeWarmup();
};
const getStatus = () => {
  return {
    name: JOB_CONFIG.name,
    schedule: JOB_CONFIG.schedule,
    enabled: JOB_CONFIG.enabled,
    running: !!scheduledTask,
    nextRun: scheduledTask ? scheduledTask.nextDates().toISOString() : null
  };
};
module.exports = {
  init,
  stop,
  runNow,
  getStatus,
  executeWarmup,
  JOB_CONFIG
};
