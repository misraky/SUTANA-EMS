const { validationResult, matchedData } = require('express-validator');
const AppError = require('../../utils/AppError');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    console.warn('❌ validationResult failed details:', JSON.stringify(formattedErrors, null, 2));
    return next(new AppError('Validation failed', 400, formattedErrors));
  }
  req.validatedData = matchedData(req);
  next();
};
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      return next(new AppError('Validation failed', 400, errors));
    }
    req.validatedBody = value;
    next();
  };
};
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(new AppError('Invalid query parameters', 400, errors));
    }
    req.validatedQuery = value;
    next();
  };
};
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(new AppError('Invalid URL parameters', 400, errors));
    }
    req.validatedParams = value;
    next();
  };
};
const validateAll = (schemas) => {
  return (req, res, next) => {
    const errors = [];
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        errors.push(...error.details.map(d => ({ ...d, source: 'body' })));
      } else {
        req.validatedBody = value;
      }
    }
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) {
        errors.push(...error.details.map(d => ({ ...d, source: 'query' })));
      } else {
        req.validatedQuery = value;
      }
    }
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, { abortEarly: false, stripUnknown: true });
      if (error) {
        errors.push(...error.details.map(d => ({ ...d, source: 'params' })));
      } else {
        req.validatedParams = value;
      }
    }
    if (errors.length > 0) {
      const formattedErrors = errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        source: err.source,
        value: err.context?.value
      }));
      return next(new AppError('Validation failed', 400, formattedErrors));
    }
    next();
  };
};
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
/**
 * Sanitize all string fields in object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};
const commonSchemas = {
  pagination: {
    page: (val) => parseInt(val) >= 1 ? parseInt(val) : 1,
    limit: (val) => {
      const limit = parseInt(val);
      return limit >= 1 && limit <= 100 ? limit : 25;
    }
  },
  dateRange: {
    startDate: (val) => val ? new Date(val) : null,
    endDate: (val) => val ? new Date(val) : null
  },
  id: {
    id: (val) => {
      const id = parseInt(val);
      if (isNaN(id) || id < 1) throw new Error('Invalid ID');
      return id;
    }
  },
  email: {
    email: (val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) throw new Error('Invalid email format');
      return val.toLowerCase();
    }
  },
  phone: {
    phone: (val) => {
      const phoneRegex = /^09[0-9]{8}$/;
      if (!phoneRegex.test(val)) throw new Error('Invalid Ethiopian phone number (format: 09xxxxxxxx)');
      return val;
    }
  }
};
module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateAll,
  sanitizeInput,
  sanitizeObject,
  sanitizeBody,
  commonSchemas
};
