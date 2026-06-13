const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getFileInfo, deleteFile } = require('../middleware/upload.middleware');
const { audit } = require('../../config/logger');

const pharmacyController = {
  // ==============================
  // DASHBOARD
  // ==============================
  getDashboardStats: async (req, res) => {
    // 1. Total Sales from pos_sales
    const totalSalesQuery = await db('pos_sales').sum('total_amount as total').first();
    const totalSales = totalSalesQuery.total || 0;

    // 2. Customers Served
    const customersServedQuery = await db('pos_sales').countDistinct('customer_id as count').first();
    const customersServed = customersServedQuery.count || 0;

    // 3. Low Stock Alerts
    const lowStockAlerts = await db('pharmacy_medications')
      .whereRaw('stock_quantity <= reorder_level')
      .select('id', 'name', 'stock_quantity as stock', 'price_unit as unit', 'reorder_level as reorderLevel');
    
    const today = new Date().toISOString().split('T')[0];
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 30);
    const expiringDateStr = expiringDate.toISOString().split('T')[0];

    // 4. Expired/Expiring Products
    const expiredProducts = await db('pharmacy_medications')
      .where('expiry_date', '<', today)
      .select('id', 'name', 'expiry_date as date');
      
    const expiringProducts = await db('pharmacy_medications')
      .where('expiry_date', '>=', today)
      .andWhere('expiry_date', '<=', expiringDateStr)
      .select('id', 'name', 'expiry_date as date');
      
    const expiredList = [
      ...expiredProducts.map(p => ({ ...p, status: 'expired' })),
      ...expiringProducts.map(p => ({ ...p, status: 'expiring' }))
    ];

    // 5. Prescription Refill Requests (Mocked since no table exists yet)
    const refillRequests = [
      { 
        id: 'RX-001', customer: 'Alemitu T.', medicine: 'Amoxicillin 500mg', 
        qty: 2, unit: 'strips', status: 'PENDING' 
      },
      { 
        id: 'RX-002', customer: 'Biruk D.', medicine: 'Insulin Glargine', 
        qty: 2, unit: 'vials', status: 'READY_FOR_PICKUP' 
      }
    ];

    res.json({
      status: 'success',
      data: {
        totalSales,
        customersServed,
        lowStockAlerts,
        expiredList,
        refillRequests
      }
    });
  },

  // ==============================
  // CATEGORIES
  // ==============================
  getCategories: async (req, res) => {
    const categories = await db('pharmacy_categories').orderBy('display_order', 'asc');
    
    // Get product counts for each category
    const counts = await db('pharmacy_medications')
      .select('category_id')
      .count('* as count')
      .groupBy('category_id');
      
    const categoriesWithCounts = categories.map(cat => {
      const countItem = counts.find(c => c.category_id === cat.id);
      return {
        ...cat,
        product_count: countItem ? parseInt(countItem.count) : 0
      };
    });

    res.json({ status: 'success', data: categoriesWithCounts });
  },

  getCategoryById: async (req, res) => {
    const category = await db('pharmacy_categories').where({ id: req.params.id }).first();
    if (!category) throw new AppError('Category not found', 404);
    res.json({ status: 'success', data: category });
  },

  createCategory: async (req, res) => {
    const { name, description, icon_class, display_order, is_active } = req.body;
    
    if (!name) {
      throw new AppError('Category name is required', 400);
    }

    let slug = req.body.slug;
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    let cover_image = null;
    if (req.file) {
      cover_image = getFileInfo(req.file).url;
    }

    let parsed_is_active = 1;
    if (is_active !== undefined) {
      parsed_is_active = (is_active === 'true' || is_active === true || is_active === 1 || is_active === '1') ? 1 : 0;
    }

    const [id] = await db('pharmacy_categories').insert({
      name, slug, description, cover_image, icon_class, 
      display_order: display_order ? parseInt(display_order) : 0,
      is_active: parsed_is_active
    });

    const category = await db('pharmacy_categories').where({ id }).first();
    
    if (req.user) {
      await audit('CREATE_PHARMACY_CATEGORY', req.user.id, { details: { categoryId: id, name } });
    }

    res.status(201).json({ status: 'success', data: category });
  },

  updateCategory: async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const existing = await db('pharmacy_categories').where({ id }).first();
    if (!existing) throw new AppError('Category not found', 404);

    if (req.file) {
      updateData.cover_image = getFileInfo(req.file).url;
      if (existing.cover_image) {
        deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
      }
    }

    if (updateData.display_order !== undefined) {
      updateData.display_order = parseInt(updateData.display_order) || 0;
    }
    
    if (updateData.is_active !== undefined) {
      updateData.is_active = (updateData.is_active === 'true' || updateData.is_active === true || updateData.is_active === 1 || updateData.is_active === '1') ? 1 : 0;
    }

    await db('pharmacy_categories').where({ id }).update(updateData);
    const category = await db('pharmacy_categories').where({ id }).first();
    
    if (req.user) {
      await audit('UPDATE_PHARMACY_CATEGORY', req.user.id, { details: { categoryId: id } });
    }

    res.json({ status: 'success', data: category });
  },

  deleteCategory: async (req, res) => {
    const { id } = req.params;
    
    const products = await db('pharmacy_medications').where({ category_id: id }).count('* as count').first();
    if (products.count > 0) {
      throw new AppError('Cannot delete category containing products', 400);
    }

    const existing = await db('pharmacy_categories').where({ id }).first();
    if (!existing) throw new AppError('Category not found', 404);

    if (existing.cover_image) {
      deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
    }

    await db('pharmacy_categories').where({ id }).del();
    
    if (req.user) {
      await audit('DELETE_PHARMACY_CATEGORY', req.user.id, { details: { categoryId: id } });
    }

    res.status(204).send();
  },

  // ==============================
  // MEDICATIONS / PRODUCTS
  // ==============================
  getProducts: async (req, res) => {
    const products = await db('pharmacy_medications as m')
      .join('pharmacy_categories as c', 'm.category_id', 'c.id')
      .select('m.*', 'c.name as category_name')
      .orderBy('m.created_at', 'desc');
      
    res.json({ status: 'success', data: products });
  },

  searchProducts: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ status: 'success', data: [] });

    const products = await db('pharmacy_medications as m')
      .join('pharmacy_categories as c', 'm.category_id', 'c.id')
      .select('m.*', 'c.name as category_name')
      .where('m.name', 'like', `%${q}%`)
      .orWhere('m.generic_name', 'like', `%${q}%`)
      .orderBy('m.name', 'asc');

    res.json({ status: 'success', data: products });
  },

  getProductById: async (req, res) => {
    const product = await db('pharmacy_medications as m')
      .join('pharmacy_categories as c', 'm.category_id', 'c.id')
      .select('m.*', 'c.name as category_name')
      .where('m.id', req.params.id)
      .first();
      
    if (!product) throw new AppError('Product not found', 404);
    res.json({ status: 'success', data: product });
  },

  getProductsByCategory: async (req, res) => {
    const products = await db('pharmacy_medications as m')
      .join('pharmacy_categories as c', 'm.category_id', 'c.id')
      .select('m.*', 'c.name as category_name')
      .where('m.category_id', req.params.id)
      .orderBy('m.name', 'asc');
      
    res.json({ status: 'success', data: products });
  },

  createProduct: async (req, res) => {
    const data = { ...req.body };
    
    if (!data.name) {
      throw new AppError('Product name is required', 400);
    }

    // Parse numeric/boolean fields
    if (data.price) data.price = parseFloat(data.price);
    if (data.stock_quantity) data.stock_quantity = parseInt(data.stock_quantity);
    if (data.reorder_level) data.reorder_level = parseInt(data.reorder_level);
    if (data.is_prescription_required !== undefined) data.is_prescription_required = data.is_prescription_required === 'true' || data.is_prescription_required === true;
    if (data.is_active !== undefined) data.is_active = data.is_active === 'true' || data.is_active === true;
    if (data.expiry_date === '') data.expiry_date = null;

    if (req.files && req.files.drug_image && req.files.drug_image[0]) {
      data.drug_image = getFileInfo(req.files.drug_image[0]).url;
    }
    if (req.files && req.files.cover_image && req.files.cover_image[0]) {
      data.cover_image = getFileInfo(req.files.cover_image[0]).url;
    }

    const [id] = await db('pharmacy_medications').insert(data);
    const product = await db('pharmacy_medications').where({ id }).first();
    
    if (req.user) {
      await audit('CREATE_PHARMACY_PRODUCT', req.user.id, { details: { productId: id, name: data.name } });
    }

    res.status(201).json({ status: 'success', data: product });
  },

  updateProduct: async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    
    const existing = await db('pharmacy_medications').where({ id }).first();
    if (!existing) throw new AppError('Product not found', 404);

    // Parse numeric/boolean fields
    if (data.price) data.price = parseFloat(data.price);
    if (data.stock_quantity) data.stock_quantity = parseInt(data.stock_quantity);
    if (data.reorder_level) data.reorder_level = parseInt(data.reorder_level);
    if (data.is_prescription_required !== undefined) data.is_prescription_required = data.is_prescription_required === 'true' || data.is_prescription_required === true;
    if (data.is_active !== undefined) data.is_active = data.is_active === 'true' || data.is_active === true;
    if (data.expiry_date === '') data.expiry_date = null;

    if (req.files && req.files.drug_image && req.files.drug_image[0]) {
      data.drug_image = getFileInfo(req.files.drug_image[0]).url;
      if (existing.drug_image) deleteFile(existing.drug_image.replace('/uploads/', 'uploads/'));
    }
    if (req.files && req.files.cover_image && req.files.cover_image[0]) {
      data.cover_image = getFileInfo(req.files.cover_image[0]).url;
      if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
    }

    await db('pharmacy_medications').where({ id }).update(data);
    const product = await db('pharmacy_medications').where({ id }).first();
    
    if (req.user) {
      await audit('UPDATE_PHARMACY_PRODUCT', req.user.id, { details: { productId: id } });
    }

    res.json({ status: 'success', data: product });
  },

  deleteProduct: async (req, res) => {
    const { id } = req.params;
    
    const existing = await db('pharmacy_medications').where({ id }).first();
    if (!existing) throw new AppError('Product not found', 404);

    if (existing.drug_image) deleteFile(existing.drug_image.replace('/uploads/', 'uploads/'));
    if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));

    // Delete related stock movements first
    await db('pharmacy_stock_movements').where({ medication_id: id }).del();
    await db('pharmacy_medications').where({ id }).del();
    
    if (req.user) {
      await audit('DELETE_PHARMACY_PRODUCT', req.user.id, { details: { productId: id } });
    }

    res.status(204).send();
  },

  updateStock: async (req, res) => {
    const { id } = req.params;
    const { quantity_change, reason, reference_no } = req.body;

    if (!quantity_change) throw new AppError('Quantity change is required', 400);

    const product = await db('pharmacy_medications').where({ id }).first();
    if (!product) throw new AppError('Product not found', 404);

    const newStock = product.stock_quantity + parseInt(quantity_change);
    if (newStock < 0) throw new AppError('Stock cannot go below zero', 400);

    await db.transaction(async (trx) => {
      await trx('pharmacy_medications')
        .where({ id })
        .update({ stock_quantity: newStock });

      await trx('pharmacy_stock_movements').insert({
        medication_id: id,
        quantity_change: parseInt(quantity_change),
        reason,
        reference_no,
        created_by: req.user ? req.user.id : null
      });
    });

    const updatedProduct = await db('pharmacy_medications').where({ id }).first();

    if (req.user) {
      await audit('UPDATE_PHARMACY_STOCK', req.user.id, { details: { productId: id, quantity_change, newStock } });
    }

    res.json({ status: 'success', data: updatedProduct });
  },

  // ==============================
  // BRANCHES
  // ==============================
  getBranches: async (req, res) => {
    const branches = await db('pharmacy_branches').orderBy('display_order', 'asc');
    res.json({ status: 'success', data: branches });
  },

  createBranch: async (req, res) => {
    const data = { ...req.body };
    if (data.latitude) data.latitude = parseFloat(data.latitude);
    if (data.longitude) data.longitude = parseFloat(data.longitude);
    if (data.display_order) data.display_order = parseInt(data.display_order);

    if (req.file) {
      data.cover_image = getFileInfo(req.file).url;
    }

    const [id] = await db('pharmacy_branches').insert(data);
    const branch = await db('pharmacy_branches').where({ id }).first();
    res.status(201).json({ status: 'success', data: branch });
  },

  updateBranch: async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    
    if (data.latitude) data.latitude = parseFloat(data.latitude);
    if (data.longitude) data.longitude = parseFloat(data.longitude);
    if (data.display_order) data.display_order = parseInt(data.display_order);

    const existing = await db('pharmacy_branches').where({ id }).first();
    if (!existing) throw new AppError('Branch not found', 404);

    if (req.file) {
      data.cover_image = getFileInfo(req.file).url;
      if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));
    }

    await db('pharmacy_branches').where({ id }).update(data);
    const branch = await db('pharmacy_branches').where({ id }).first();
    res.json({ status: 'success', data: branch });
  },

  deleteBranch: async (req, res) => {
    const { id } = req.params;
    
    const existing = await db('pharmacy_branches').where({ id }).first();
    if (!existing) throw new AppError('Branch not found', 404);

    if (existing.cover_image) deleteFile(existing.cover_image.replace('/uploads/', 'uploads/'));

    await db('pharmacy_branches').where({ id }).del();
    res.status(204).send();
  }
};

module.exports = pharmacyController;
