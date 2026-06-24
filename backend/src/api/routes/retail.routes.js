const express = require('express');
const router = express.Router();
const retailController = require('../controllers/retail.controller');
const { authenticate, authorizeRoles, optionalAuthenticate } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');

const managerRoles = ['CEO', 'Admin', 'Sales Manager'];
const cashierRoles = ['Admin', 'CEO', 'Sales/Cashier', 'Sales Manager'];

// ── Public (no login required) ──────────────────────────────────
router.get('/categories', retailController.getCategories);
router.get('/products', retailController.getProducts);
router.get('/products/:id', retailController.getProductById);
router.post('/track-order', retailController.trackOrder);

// ── Customer (login required) ──────────────────────────────────
router.use('/cart', authenticate);
router.get('/cart', retailController.getCart);
router.post('/cart/add', retailController.addToCart);
router.put('/cart/item/:id', retailController.updateCartItem);
router.delete('/cart/item/:id', retailController.removeCartItem);
router.delete('/cart', retailController.clearCart);

router.post('/orders/place', authenticate, retailController.placeOrder);
router.get('/orders/my-orders', authenticate, retailController.getMyOrders);

// ── Cashier (Admin, CEO) ───────────────────────────────────────
const cashierAuth = [authenticate, authorizeRoles(cashierRoles)];

router.post('/shifts/open', ...cashierAuth, retailController.openShift);
router.get('/shifts/current', ...cashierAuth, retailController.getCurrentShift);
router.get('/shifts/history', ...cashierAuth, retailController.getShiftHistory);
router.post('/shifts/close', ...cashierAuth, retailController.closeShift);

router.post('/pos/checkout', ...cashierAuth, retailController.posCheckout);
router.get('/pos/transactions', ...cashierAuth, retailController.getTransactions);

// Product management
router.put('/products/:id/stock', ...cashierAuth, retailController.updateStock);
router.post('/products', ...cashierAuth, uploads.singleProductImage.single('product_image'), retailController.createProduct);
router.put('/products/:id', ...cashierAuth, uploads.singleProductImage.single('product_image'), retailController.updateProduct);
router.delete('/products/:id', ...cashierAuth, retailController.deleteProduct);

// ── Inventory (Admin, CEO) ────────────────────────────────────
router.get('/inventory', ...cashierAuth, retailController.getInventory);

// ── Manager (Admin, CEO) ──────────────────────────────────────
const managerAuth = [authenticate, authorizeRoles(managerRoles)];

router.get('/manager/dashboard', ...managerAuth, retailController.getManagerDashboard);
router.get('/manager/sales-trends', ...managerAuth, retailController.getSalesTrends);
router.get('/manager/cashier-activity', ...managerAuth, retailController.getCashierActivity);
router.post('/manager/approve-discount', ...managerAuth, retailController.approveDiscount);
router.post('/manager/approve-refund', ...managerAuth, retailController.approveRefund);
router.post('/manager/verify-shift', ...managerAuth, retailController.verifyShift);

// ── Finance ──────────────────────────────────────────────────
router.get('/finance/reconciliation', ...managerAuth, retailController.getReconciliation);
router.post('/finance/deposit', ...managerAuth, retailController.recordDeposit);
router.get('/finance/audit-log', ...managerAuth, retailController.getAuditLog);
router.post('/finance/void', ...managerAuth, retailController.approveVoid);

// Admin: categories
router.post('/categories', ...managerAuth, retailController.createCategory);

module.exports = router;
