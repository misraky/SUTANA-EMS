const express = require('express');
const router = express.Router();
const farmingController = require('../controllers/farming.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const workerRoles = ['Farming Manager', 'Admin', 'CEO'];

// ── Public (no login required) ──────────────────────────────────
router.get('/categories', farmingController.getCategories);
router.get('/products', farmingController.getProducts);

// ── Customer (login required) ──────────────────────────────────
router.post('/orders', authenticate, farmingController.createOrder);
router.get('/orders/my-orders', authenticate, farmingController.getCustomerOrders);

// ── Worker / Manager (role required) ──────────────────────────
const workerAuth = [authenticate, authorizeRoles(...workerRoles)];

// Overview
router.get('/overview/stats', ...workerAuth, farmingController.getOverviewStats);

// Product management
router.get('/admin/products', ...workerAuth, farmingController.getAllProductsAdmin);
router.post('/admin/products', ...workerAuth, farmingController.createProduct);
router.put('/admin/products/:id', ...workerAuth, farmingController.updateProduct);
router.patch('/admin/products/:id/stock', ...workerAuth, farmingController.updateStock);

// Category management
router.post('/admin/categories', ...workerAuth, farmingController.createCategory);

// Order management
router.get('/admin/orders', ...workerAuth, farmingController.getAllOrders);
router.patch('/admin/orders/:id/status', ...workerAuth, farmingController.updateOrderStatus);

// POS
router.post('/pos/checkout', ...workerAuth, farmingController.posCheckout);

// Finance
router.get('/finance/daily-summary', ...workerAuth, farmingController.getDailySalesSummary);
router.post('/finance/submit-report', ...workerAuth, farmingController.submitFinanceReport);

module.exports = router;
