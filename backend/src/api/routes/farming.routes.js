const express = require('express');
const router = express.Router();
const farmingController = require('../controllers/farming.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads } = require('../../config/multer');

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
router.post('/admin/products', ...workerAuth, uploads.singleProductImage.single('product_image'), farmingController.createProduct);
router.put('/admin/products/:id', ...workerAuth, uploads.singleProductImage.single('product_image'), farmingController.updateProduct);
router.patch('/admin/products/:id/stock', ...workerAuth, farmingController.updateStock);

// Category management
router.post('/admin/categories', ...workerAuth, uploads.singleProductImage.single('cover_image'), farmingController.createCategory);

// Order management
router.get('/admin/orders', ...workerAuth, farmingController.getAllOrders);
router.patch('/admin/orders/:id/status', ...workerAuth, farmingController.updateOrderStatus);

// POS
router.post('/pos/checkout', ...workerAuth, farmingController.posCheckout);

// Reorder requests
router.post('/reorder-requests', ...workerAuth, farmingController.createReorderRequest);
router.get('/reorder-requests', ...workerAuth, farmingController.getReorderRequests);
router.patch('/reorder-requests/:id/approve', ...workerAuth, farmingController.approveReorderRequest);

// Shift management
router.post('/shifts/open', ...workerAuth, farmingController.openShift);
router.post('/shifts/close', ...workerAuth, farmingController.closeShift);
router.get('/shifts/current', ...workerAuth, farmingController.getCurrentShift);
router.get('/shifts/history', ...workerAuth, farmingController.getShiftHistory);

// Finance
router.get('/finance/daily-summary', ...workerAuth, farmingController.getDailySalesSummary);
router.post('/finance/submit-report', ...workerAuth, farmingController.submitFinanceReport);

module.exports = router;
