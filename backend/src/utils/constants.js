const APP = {
  NAME: 'Sutana EMS',
  VERSION: '1.0.0',
  ENV: {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
    TEST: 'test'
  }
};
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
};
const USER_ROLES = {
  ADMIN: 'Admin',
  CEO: 'CEO',
  FINANCE: 'Finance',
  PRINTING_SUPERVISOR: 'Printing Supervisor',
  PURCHASE: 'Purchase',
  STORE_WORKER: 'Store Worker',
  SALES_CASHIER: 'Sales/Cashier',
  CUSTOMER: 'Customer'
};
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};
const USER_STATUS_COLORS = {
  [USER_STATUS.ACTIVE]: '#10B981',
  [USER_STATUS.INACTIVE]: '#6B7280',
  [USER_STATUS.SUSPENDED]: '#F59E0B',
  [USER_STATUS.DELETED]: '#EF4444'
};
const DEPARTMENTS = {
  ADMIN: 'Admin',
  CEO: 'CEO',
  FINANCE: 'Finance',
  PRINTING: 'Printing',
  PURCHASE: 'Purchase',
  SALES: 'Sales',
  INVENTORY: 'Inventory'
};
const ORDER_STATUS = {
  RECEIVED: 'received',
  IN_PROGRESS: 'in_progress',
  QUALITY_CHECK: 'quality_check',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};
const ORDER_STATUS_NAMES = {
  [ORDER_STATUS.RECEIVED]: 'Received',
  [ORDER_STATUS.IN_PROGRESS]: 'In Progress',
  [ORDER_STATUS.QUALITY_CHECK]: 'Quality Check',
  [ORDER_STATUS.READY]: 'Ready',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled'
};
const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.RECEIVED]: '#9CA3AF',
  [ORDER_STATUS.IN_PROGRESS]: '#3B82F6',
  [ORDER_STATUS.QUALITY_CHECK]: '#F59E0B',
  [ORDER_STATUS.READY]: '#10B981',
  [ORDER_STATUS.DELIVERED]: '#059669',
  [ORDER_STATUS.CANCELLED]: '#EF4444'
};
const PRODUCT_TYPES = {
  BOOK: 'Book',
  MODULE: 'Module',
  EXAM: 'Exam',
  BROCHURE: 'Brochure',
  TAX_RECEIPT: 'TaxReceipt'
};
const PAPER_TYPES = {
  A3: 'A3',
  A4: 'A4',
  A5: 'A5'
};
const BINDING_TYPES = {
  NONE: 'None',
  SPIRAL: 'Spiral',
  THERMAL: 'Thermal'
};
const CUSTOMER_TYPES = {
  GOVERNMENT: 'Government',
  SCHOLAR: 'Scholar',
  LECTURER: 'Lecturer',
  CHURCH: 'Church',
  REGULAR: 'Regular'
};
const CUSTOMER_TYPE_COLORS = {
  [CUSTOMER_TYPES.GOVERNMENT]: '#EF4444',
  [CUSTOMER_TYPES.SCHOLAR]: '#3B82F6',
  [CUSTOMER_TYPES.LECTURER]: '#10B981',
  [CUSTOMER_TYPES.CHURCH]: '#8B5CF6',
  [CUSTOMER_TYPES.REGULAR]: '#6B7280'
};
const PO_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SENT: 'sent',
  PARTIAL_RECEIVED: 'partial_received',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled'
};
const PO_STATUS_NAMES = {
  [PO_STATUS.DRAFT]: 'Draft',
  [PO_STATUS.PENDING]: 'Pending Approval',
  [PO_STATUS.APPROVED]: 'Approved',
  [PO_STATUS.REJECTED]: 'Rejected',
  [PO_STATUS.SENT]: 'Sent to Supplier',
  [PO_STATUS.PARTIAL_RECEIVED]: 'Partial Received',
  [PO_STATUS.COMPLETE]: 'Complete',
  [PO_STATUS.CANCELLED]: 'Cancelled'
};
const PO_STATUS_COLORS = {
  [PO_STATUS.DRAFT]: '#6B7280',
  [PO_STATUS.PENDING]: '#F59E0B',
  [PO_STATUS.APPROVED]: '#10B981',
  [PO_STATUS.REJECTED]: '#EF4444',
  [PO_STATUS.SENT]: '#3B82F6',
  [PO_STATUS.PARTIAL_RECEIVED]: '#8B5CF6',
  [PO_STATUS.COMPLETE]: '#059669',
  [PO_STATUS.CANCELLED]: '#EF4444'
};
const SECTORS = {
  PRINTING: 'Printing',
  SALES: 'Sales',
  PHARMACY: 'Pharmacy',
  GENERAL_OFFICE: 'General Office'
};
const PAYMENT_METHODS = {
  CASH: 'Cash',
  CREDIT: 'Credit',
  BANK_TRANSFER: 'Bank Transfer',
  TELEBIRR: 'Telebirr',
  CHECK: 'Check'
};
const SALE_STATUS = {
  COMPLETED: 'completed',
  VOIDED: 'voided',
  REFUNDED: 'refunded'
};
const SALE_STATUS_COLORS = {
  [SALE_STATUS.COMPLETED]: '#10B981',
  [SALE_STATUS.VOIDED]: '#EF4444',
  [SALE_STATUS.REFUNDED]: '#F59E0B'
};
const MOVEMENT_TYPES = {
  SALE: 'Sale',
  PURCHASE: 'Purchase',
  ADJUSTMENT: 'Adjustment',
  DAMAGED: 'Damaged',
  LOST: 'Lost',
  EXPIRED: 'Expired'
};
const PRODUCT_CATEGORIES = {
  PRINTING: 'Printing',
  SALES: 'Sales',
  PHARMACY: 'Pharmacy',
  OFFICE: 'Office'
};
const UNITS = {
  EACH: 'Each',
  SHEET: 'Sheet',
  KILOGRAM: 'kg',
  LITER: 'Liter',
  MILLILITER: 'mL',
  GRAM: 'gram'
};
const EXPENSE_CATEGORIES = {
  UTILITY: 'Utility',
  SALARY: 'Salary',
  RENT: 'Rent',
  SUPPLIES: 'Supplies',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other'
};
const EXPENSE_APPROVAL_LIMITS = {
  [EXPENSE_CATEGORIES.SALARY]: 50000,
  [EXPENSE_CATEGORIES.RENT]: 100000,
  [EXPENSE_CATEGORIES.MAINTENANCE]: 20000
};
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};
const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: '#F59E0B',
  [PAYMENT_STATUS.COMPLETED]: '#10B981',
  [PAYMENT_STATUS.FAILED]: '#EF4444',
  [PAYMENT_STATUS.REFUNDED]: '#6B7280'
};
const COMM_TYPE = {
  EMAIL: 'email',
  SMS: 'sms'
};
const COMM_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  PERMANENTLY_FAILED: 'permanently_failed'
};
const MAX_RETRY_ATTEMPTS = 5;
const DEFAULT_TAX_RATE = 15;
const HIGH_VALUE_PO_THRESHOLD = 200000;
const DISCOUNT_LIMITS = {
  [USER_ROLES.SALES_CASHIER]: 5,
  [USER_ROLES.FINANCE]: 15,
  [USER_ROLES.CEO]: 25,
  [USER_ROLES.ADMIN]: 100
};
const PRINTING_BASE_PRICES = {
  [PAPER_TYPES.A4]: 0.50,
  [PAPER_TYPES.A5]: 0.75,
  [PAPER_TYPES.A3]: 1.00
};
const COLOR_PRINTING_MULTIPLIER = 2.0;
const BINDING_COSTS = {
  [BINDING_TYPES.SPIRAL]: 500,
  [BINDING_TYPES.THERMAL]: 300,
  [BINDING_TYPES.NONE]: 0
};
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 72,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  HISTORY_COUNT: 5
};
const SESSION_CONFIG = {
  TIMEOUT_MINUTES: 30,
  MAX_CONCURRENT_SESSIONS: 3,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15
};
const RATE_LIMITS = {
  DEFAULT: { windowMs: 60000, max: 100 },
  AUTH: { windowMs: 900000, max: 10 },
  LOGIN: { windowMs: 900000, max: 5 },
  CHECKOUT: { windowMs: 60000, max: 30 },
  API_KEY: { windowMs: 60000, max: 100 }
};
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ETHIOPIAN_PHONE: /^09[0-9]{8}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ORDER_NUMBER: /^([A-Z]{2,3})-([0-9]{8})-([0-9]{4})$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  TIN: /^\d{10}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_SPACE: /^[a-zA-Z0-9\s]+$/
};
const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 25,
  MAX_LIMIT: 100,
  SORT_BY: 'created_at',
  SORT_ORDER: 'DESC'
};
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm:ss',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  FILENAME: 'YYYY-MM-DD_HH-mm-ss'
};
const CACHE_KEYS = {
  USER: 'user',
  SESSION: 'session',
  PRODUCT: 'product',
  ORDER: 'order',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  SETTING: 'setting',
  REPORT: 'report',
  DASHBOARD: 'dashboard',
  LIST: 'list',
  RATE_LIMIT: 'rl',
  LOCKOUT: 'lockout',
  TOKEN: 'token'
};
const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};
const MIME_TYPES = {
  JSON: 'application/json',
  PDF: 'application/pdf',
  CSV: 'text/csv',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  TXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  ZIP: 'application/zip'
};
const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const UPLOAD_DIRS = {
  ORDERS: 'uploads/orders',
  RECEIPTS: 'uploads/receipts',
  TAX_DOCUMENTS: 'uploads/tax-documents',
  EXPENSES: 'uploads/expenses',
  PRODUCTS: 'uploads/products',
  PROFILE: 'uploads/profile',
  TEMP: 'uploads/temp',
  EXPORTS: 'exports'
};
const API_VERSION = 'v1';
const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After'
};
module.exports = {
  APP,
  HTTP_STATUS,
  HTTP_METHODS,
  USER_ROLES,
  USER_STATUS,
  USER_STATUS_COLORS,
  DEPARTMENTS,
  ORDER_STATUS,
  ORDER_STATUS_NAMES,
  ORDER_STATUS_COLORS,
  PRODUCT_TYPES,
  PAPER_TYPES,
  BINDING_TYPES,
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_COLORS,
  PO_STATUS,
  PO_STATUS_NAMES,
  PO_STATUS_COLORS,
  SECTORS,
  PAYMENT_METHODS,
  SALE_STATUS,
  SALE_STATUS_COLORS,
  MOVEMENT_TYPES,
  PRODUCT_CATEGORIES,
  UNITS,
  EXPENSE_CATEGORIES,
  EXPENSE_APPROVAL_LIMITS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_COLORS,
  COMM_TYPE,
  COMM_STATUS,
  MAX_RETRY_ATTEMPTS,
  DEFAULT_TAX_RATE,
  HIGH_VALUE_PO_THRESHOLD,
  DISCOUNT_LIMITS,
  PRINTING_BASE_PRICES,
  COLOR_PRINTING_MULTIPLIER,
  BINDING_COSTS,
  PASSWORD_REQUIREMENTS,
  SESSION_CONFIG,
  RATE_LIMITS,
  REGEX,
  DEFAULT_PAGINATION,
  DATE_FORMATS,
  CACHE_KEYS,
  ERROR_CODES,
  MIME_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  UPLOAD_DIRS,
  API_VERSION,
  RATE_LIMIT_HEADERS
};
