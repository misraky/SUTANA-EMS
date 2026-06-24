const express = require('express');
const router = express.Router();
const farmingController = require('../controllers/farming.controller');
const { authenticate, authorize, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads } = require('../../config/multer');

const workerRoles = ['Farming Worker', 'Farming Manager', 'Admin', 'CEO'];

// ── Public (no login required) ──────────────────────────────────
router.get('/categories', farmingController.getCategories);
router.get('/products', farmingController.getProducts);

// ── Customer (login required) ──────────────────────────────────
router.post('/orders', authenticate, farmingController.createOrder);
router.get('/orders/my-orders', authenticate, farmingController.getCustomerOrders);

// ── Worker / Manager (role required) ──────────────────────────
const workerAuth = [authenticate, authorizeRoles(workerRoles)];

// Overview
router.get('/overview/stats', ...workerAuth, farmingController.getOverviewStats);

// Product management
router.get('/admin/products', ...workerAuth, farmingController.getAllProductsAdmin);
router.post('/admin/products', ...workerAuth, uploads.singleProductImage.single('product_image'), farmingController.createProduct);
router.put('/admin/products/:id', ...workerAuth, uploads.singleProductImage.single('product_image'), farmingController.updateProduct);
router.patch('/admin/products/:id/stock', ...workerAuth, farmingController.updateStock);

// Category management
router.post('/admin/categories', ...workerAuth, uploads.singleProductImage.single('cover_image'), farmingController.createCategory);
router.put('/admin/categories/:id', ...workerAuth, uploads.singleProductImage.single('cover_image'), farmingController.updateCategory);
router.delete('/admin/categories/:id', ...workerAuth, farmingController.deleteCategory);
router.delete('/admin/products/:id', ...workerAuth, farmingController.deleteProduct);

// Worker permission toggle (Farming Manager+ only)
router.get('/admin/worker-can-add-products', ...workerAuth, farmingController.getWorkerAddProductSetting);
router.patch('/admin/worker-can-add-products', ...workerAuth, farmingController.updateWorkerAddProductSetting);

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
router.post('/shifts/:shiftId/verify', authenticate, authorize(['pos:verify']), farmingController.verifyShift);

// CEO-facing: today's farming attendance (from farming_shifts, for CEO dashboard)
router.get('/attendance/today', authenticate, authorizeRoles(['CEO', 'Admin']), farmingController.getTodayFarmingAttendance);

// Budget summary
router.get('/budget-summary', ...workerAuth, farmingController.getBudgetSummary);

// Top products today
router.get('/top-products', ...workerAuth, farmingController.getTopProductsToday);

// Quick actions
router.get('/quick-actions', ...workerAuth, farmingController.getQuickActions);

// Export report (Excel / PDF)
router.get('/export-report', ...workerAuth, farmingController.exportReport);

// Manager audit log (raw SQL)
router.get('/audit/manager-data', ...workerAuth, farmingController.getManagerAuditData);

// Finance
router.get('/finance/daily-summary', ...workerAuth, farmingController.getDailySalesSummary);
router.post('/finance/submit-report', ...workerAuth, farmingController.submitFinanceReport);

// ── Product Request (Farming → Store → CEO) ──────────────────
const storeRoles = ['Store Manager', 'Store Worker', 'CEO', 'Admin'];
const ceoRoles = ['CEO', 'Admin'];
router.post('/store-requests', authenticate, authorizeRoles([...workerRoles, ...storeRoles, ...ceoRoles]), farmingController.createStoreRequest);
router.get('/store-requests', authenticate, authorizeRoles([...workerRoles, ...storeRoles, ...ceoRoles]), farmingController.getStoreRequests);
router.get('/store-requests/:id', authenticate, authorizeRoles([...workerRoles, ...storeRoles, ...ceoRoles]), farmingController.getStoreRequestDetail);
router.patch('/store-requests/:id/status', authenticate, authorizeRoles([...workerRoles, ...storeRoles, ...ceoRoles]), farmingController.updateStoreRequestStatus);

module.exports = router;
