const express = require('express');
const router = express.Router();
const rentalOrderController = require('../controllers/rentalOrder.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads } = require('../middleware/upload.middleware');

// Public/Customer routes
router.post('/', authenticate, rentalOrderController.createOrder);
router.get('/my-orders', authenticate, rentalOrderController.getCustomerOrders);
router.post('/:id/payment-proof', authenticate, uploads.singlePaymentProof.single('proof'), rentalOrderController.uploadPaymentProof);

// Manager routes
router.get('/', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.getAllOrders);
router.put('/:id/status', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.updateOrderStatus);
router.patch('/:id/status', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.updateOrderStatus);

// Finance routes
router.get('/pending-payments', authenticate, authorizeRoles(['Finance', 'Admin', 'CEO']), rentalOrderController.getPendingPayments);
router.post('/:id/verify-payment', authenticate, authorizeRoles(['Finance', 'Admin', 'CEO']), rentalOrderController.verifyPayment);

// Lifecycle Routes
router.post('/:id/cancel', authenticate, rentalOrderController.cancelOrder);
router.post('/:id/cancel/approve', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.approveCancellation);
router.post('/:id/extend', authenticate, rentalOrderController.extendOrder);
router.post('/:id/extend/approve', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.approveExtension);
router.post('/:id/process-return', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.processReturn);
router.post('/:id/no-show', authenticate, authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']), rentalOrderController.markNoShow);
router.patch('/:id/pickup-remarks', authenticate, rentalOrderController.updatePickupRemarks);

module.exports = router;
