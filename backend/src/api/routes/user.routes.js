const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
const createUserValidation = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^09[0-9]{8}$/).withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('departmentId')
    .isInt().withMessage('Valid department ID is required'),
  body('roleIds')
    .isArray().withMessage('Role IDs must be an array')
    .notEmpty().withMessage('At least one role is required'),
  body('statusId')
    .optional()
    .isInt().withMessage('Valid status ID is required')
];
const updateUserValidation = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^09[0-9]{8}$/).withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('departmentId')
    .optional()
    .isInt().withMessage('Valid department ID is required'),
  body('roleIds')
    .optional()
    .isArray().withMessage('Role IDs must be an array'),
  body('statusId')
    .optional()
    .isInt().withMessage('Valid status ID is required')
];
const listUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('search')
    .optional()
    .isString().trim(),
  query('departmentId')
    .optional()
    .isInt().withMessage('Valid department ID is required'),
  query('roleId')
    .optional()
    .isInt().withMessage('Valid role ID is required'),
  query('statusId')
    .optional()
    .isInt().withMessage('Valid status ID is required')
];
const userIdParamValidation = [
  param('id')
    .isInt().withMessage('User ID must be a valid integer')
    .toInt()
];
router.get(
  '/',
  authenticate,
  authorize(['users:read']),
  listUsersValidation,
  validate,
  UserController.getAllUsers
);
router.get(
  '/:id',
  authenticate,
  authorize(['users:read']),
  userIdParamValidation,
  validate,
  UserController.getUserById
);
router.post(
  '/',
  authenticate,
  authorize(['users:create']),
  createUserValidation,
  validate,
  UserController.createUser
);
router.put(
  '/:id',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  updateUserValidation,
  validate,
  UserController.updateUser
);
router.delete(
  '/:id',
  authenticate,
  authorize(['users:delete']),
  userIdParamValidation,
  validate,
  UserController.deleteUser
);
router.post(
  '/:id/restore',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  validate,
  UserController.restoreUser
);
router.post(
  '/:id/force-reset',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  validate,
  UserController.forcePasswordReset
);
router.get(
  '/:id/permissions',
  authenticate,
  authorize(['users:read']),
  userIdParamValidation,
  validate,
  UserController.getUserPermissions
);
router.post(
  '/:id/roles',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  body('roleIds').isArray().withMessage('Role IDs must be an array'),
  validate,
  UserController.assignRoles
);
router.delete(
  '/:id/roles/:roleId',
  authenticate,
  authorize(['users:update']),
  param('id').isInt(),
  param('roleId').isInt(),
  validate,
  UserController.removeRole
);
router.get(
  '/export',
  authenticate,
  authorize(['users:read', 'reports:export']),
  query('format').isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
  validate,
  UserController.exportUsers
);
router.get(
  '/departments',
  authenticate,
  UserController.getDepartments
);
router.get(
  '/roles',
  authenticate,
  authorize(['users:read']),
  UserController.getRoles
);
module.exports = router;
