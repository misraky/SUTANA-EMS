const express = require('express');
const router = express.Router();
const carController = require('../controllers/car.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { uploads } = require('../../config/multer');

// Configure multer for handling up to 4 images
const uploadFields = uploads.carImages.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]);

// Public route for Fleet Gallery
router.get('/public', carController.getAllCarsPublic);

// Protected routes for Car Renting Manager and Admin
router.use(authenticate);
router.use(authorizeRoles(['Car Renting Manager', 'Admin', 'CEO']));

router.get('/', carController.getAllCarsManager);
router.post('/', uploadFields, carController.createCar);
router.put('/:id', uploadFields, carController.updateCar);
router.delete('/:id', carController.deleteCar);
router.patch('/:id/restore', carController.restoreCar);
router.delete('/:id/permanent', carController.hardDeleteCar);

module.exports = router;
