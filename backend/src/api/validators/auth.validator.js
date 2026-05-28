const { body, query, param } = require('express-validator');
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username (email or phone) is required')
    .trim()
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
];
const registerValidation = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^09[0-9]{8}$/)
    .withMessage('Phone number must be Ethiopian format (09xxxxxxxx)')
    .trim(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
    .withMessage('Password must contain at least one special character')
];
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
    .withMessage('New password must contain at least one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password cannot be the same as current password');
      }
      return true;
    })
];
const requestPasswordResetValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase()
];
const confirmPasswordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Invalid token format'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
    .withMessage('Password must contain at least one special character')
];
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Invalid token format')
];
const verifyEmailValidation = [
  param('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isString()
    .withMessage('Invalid token format')
];
const resendVerificationValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase()
];
const enable2FAValidation = [
];
const verify2FAValidation = [
  body('code')
    .notEmpty()
    .withMessage('2FA verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits')
    .isNumeric()
    .withMessage('2FA code must contain only numbers')
];
const disable2FAValidation = [
  body('code')
    .notEmpty()
    .withMessage('2FA verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits')
    .isNumeric()
    .withMessage('2FA code must contain only numbers')
];
module.exports = {
  loginValidation,
  registerValidation,
  changePasswordValidation,
  requestPasswordResetValidation,
  confirmPasswordResetValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  enable2FAValidation,
  verify2FAValidation,
  disable2FAValidation
};
