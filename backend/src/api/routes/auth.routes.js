const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
const loginValidation = [
  body('username').notEmpty().withMessage('Username (email or phone) is required'),
  body('password').notEmpty().withMessage('Password is required')
];
const registerValidation = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^09[0-9]{8}$/).withMessage('Valid Ethiopian phone number is required')
];
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];
router.post('/login', limiters.login, loginValidation, validate, AuthController.login);
router.post('/register', limiters.auth, registerValidation, validate, AuthController.register);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh', AuthController.refreshToken);
router.post('/change-password', authenticate, changePasswordValidation, validate, AuthController.changePassword);
router.post('/reset-password/request', limiters.auth, body('email').isEmail(), validate, AuthController.requestPasswordReset);
router.post('/reset-password/confirm', limiters.auth, [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], validate, AuthController.confirmPasswordReset);
router.get('/me', authenticate, AuthController.getCurrentUser);
module.exports = router;
