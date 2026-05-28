const authValidators = require('./auth.validator');
const userValidators = require('./user.validator');
const printingValidators = require('./printing.validator');
const posValidators = require('./pos.validator');
const inventoryValidators = require('./inventory.validator');
const purchaseValidators = require('./purchase.validator');
const financeValidators = require('./finance.validator');
const reportValidators = require('./report.validator');
const adminValidators = require('./admin.validator');
const ceoValidators = require('./ceo.validator');
const customerValidators = require('./customer.validator');
const externalValidators = require('./external.validator');
const commonRules = {
  id: {
    in: ['params'],
    isInt: { errorMessage: 'ID must be a valid integer' },
    toInt: true
  },
  page: {
    in: ['query'],
    optional: true,
    isInt: { options: { min: 1 }, errorMessage: 'Page must be a positive integer' },
    toInt: true,
    default: 1
  },
  limit: {
    in: ['query'],
    optional: true,
    isInt: { options: { min: 1, max: 100 }, errorMessage: 'Limit must be between 1 and 100' },
    toInt: true,
    default: 25
  },
  date: {
    isISO8601: { errorMessage: 'Invalid date format. Use YYYY-MM-DD' },
    toDate: true
  },
  startDate: {
    in: ['query'],
    optional: true,
    isISO8601: { errorMessage: 'Invalid start date format. Use YYYY-MM-DD' }
  },
  endDate: {
    in: ['query'],
    optional: true,
    isISO8601: { errorMessage: 'Invalid end date format. Use YYYY-MM-DD' }
  },
  email: {
    isEmail: { errorMessage: 'Please provide a valid email address' },
    normalizeEmail: true,
    trim: true,
    toLowerCase: true
  },
  phone: {
    matches: { options: /^09[0-9]{8}$/, errorMessage: 'Phone number must be Ethiopian format (09xxxxxxxx)' },
    trim: true
  },
  name: {
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'Name must be between 2 and 100 characters' },
    trim: true,
    escape: true
  },
  search: {
    in: ['query'],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { min: 1 }, errorMessage: 'Search query must be at least 1 character' }
  },
  status: {
    in: ['query'],
    optional: true,
    isString: true,
    trim: true
  }
};
module.exports = {
  commonRules,
  authValidators,
  userValidators,
  printingValidators,
  posValidators,
  inventoryValidators,
  purchaseValidators,
  financeValidators,
  reportValidators,
  adminValidators,
  ceoValidators,
  customerValidators,
  externalValidators
};
