const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacy.controller');
const requestsController = require('../controllers/pharmacy.requests.controller');
const { authenticate, authorizeRoles, optionalAuthenticate } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../middleware/upload.middleware');

// Optional authentication for public endpoints (to track requests if needed, but allow public access)
router.get('/categories', optionalAuthenticate, pharmacyController.getCategories);
router.get('/categories/:id', optionalAuthenticate, pharmacyController.getCategoryById);
router.get('/products', optionalAuthenticate, pharmacyController.getProducts);
router.get('/products/search', optionalAuthenticate, pharmacyController.searchProducts);
router.get('/products/category/:id', optionalAuthenticate, pharmacyController.getProductsByCategory);
router.get('/products/:id', optionalAuthenticate, pharmacyController.getProductById);
router.get('/branches', optionalAuthenticate, pharmacyController.getBranches);

router.get('/dashboard', optionalAuthenticate, pharmacyController.getDashboardStats);

// Protected endpoints (Pharmacist, Admin, CEO)
router.use(authenticate);

// Customer: Submit & manage own requests
router.post('/requests', uploads.generic.single('prescription_image'), handleUploadError, requestsController.createRequest);
router.get('/requests/my-requests', requestsController.getMyRequests);
router.delete('/requests/:id/cancel', requestsController.cancelRequest);

// Pharmacist only endpoints
router.use(authorizeRoles(['Pharmacist', 'Admin', 'CEO']));

// Products
router.post(
  '/products', 
  uploads.generic.fields([
    { name: 'drug_image', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
  ]),
  handleUploadError,
  pharmacyController.createProduct
);
router.put(
  '/products/:id', 
  uploads.generic.fields([
    { name: 'drug_image', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
  ]),
  handleUploadError,
  pharmacyController.updateProduct
);
router.delete('/products/:id', pharmacyController.deleteProduct);
router.post('/products/:id/stock', pharmacyController.updateStock);

// Categories
router.post('/categories', uploads.pharmacyCategoryImage.single('cover_image'), handleUploadError, pharmacyController.createCategory);
router.put('/categories/:id', uploads.pharmacyCategoryImage.single('cover_image'), handleUploadError, pharmacyController.updateCategory);
router.delete('/categories/:id', pharmacyController.deleteCategory);

// Prescription Request Management (Pharmacist)
router.get('/requests', requestsController.getAllRequests);
router.get('/requests/pending', requestsController.getPendingRequests);
router.post('/requests/:id/approve', requestsController.approveRequest);
router.post('/requests/:id/reject', requestsController.rejectRequest);
router.put('/requests/:id/ready', requestsController.markReady);
router.put('/requests/:id/complete', requestsController.markComplete);

// Branches
router.post('/branches', uploads.pharmacyBranchImage.single('cover_image'), handleUploadError, pharmacyController.createBranch);
router.put('/branches/:id', uploads.pharmacyBranchImage.single('cover_image'), handleUploadError, pharmacyController.updateBranch);
router.delete('/branches/:id', pharmacyController.deleteBranch);

module.exports = router;
