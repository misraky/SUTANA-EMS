const { body, query, param } = require('express-validator');
const createUserValidation = [
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
  body('departmentId')
    .notEmpty()
    .withMessage('Department ID is required')
    .isInt({ min: 1 })
    .withMessage('Department ID must be a valid integer')
    .toInt(),
  body('roleIds')
    .isArray({ min: 1 })
    .withMessage('At least one role ID is required')
    .custom((value) => {
      for (const id of value) {
        if (typeof id !== 'number' || id < 1) {
          throw new Error('Each role ID must be a positive integer');
        }
      }
      return true;
    }),
  body('statusId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Status ID must be a valid integer')
    .toInt()
];
const updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt(),
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('phone')
    .optional()
    .matches(/^09[0-9]{8}$/)
    .withMessage('Phone number must be Ethiopian format (09xxxxxxxx)')
    .trim(),
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Department ID must be a valid integer')
    .toInt(),
  body('roleIds')
    .optional()
    .isArray()
    .withMessage('Role IDs must be an array')
    .custom((value) => {
      if (value) {
        for (const id of value) {
          if (typeof id !== 'number' || id < 1) {
            throw new Error('Each role ID must be a positive integer');
          }
        }
      }
      return true;
    }),
  body('statusId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Status ID must be a valid integer')
    .toInt()
];
const deleteUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt()
];
const restoreUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt()
];
const forcePasswordResetValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt()
];
const listUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character'),
  query('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Department ID must be a valid integer')
    .toInt(),
  query('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a valid integer')
    .toInt(),
  query('statusId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Status ID must be a valid integer')
    .toInt()
];
const getUserByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt()
];
const getUserPermissionsValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt()
];
const assignRolesValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt(),
  body('roleIds')
    .isArray({ min: 1 })
    .withMessage('At least one role ID is required')
    .custom((value) => {
      for (const id of value) {
        if (typeof id !== 'number' || id < 1) {
          throw new Error('Each role ID must be a positive integer');
        }
      }
      return true;
    })
];
const removeRoleValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid positive integer')
    .toInt(),
  param('roleId')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a valid positive integer')
    .toInt()
];
const exportUsersValidation = [
  query('format')
    .isIn(['csv', 'excel'])
    .withMessage('Format must be either "csv" or "excel"')
];
module.exports = {
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  restoreUserValidation,
  forcePasswordResetValidation,
  listUsersValidation,
  getUserByIdValidation,
  getUserPermissionsValidation,
  assignRolesValidation,
  removeRoleValidation,
  exportUsersValidation
};
