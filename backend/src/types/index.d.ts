/**
 * Sutana EMS - Global Type Definitions
 * TypeScript declaration file for the entire application
 */

// =====================================================
// User Types
// =====================================================

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  departmentId: number;
  departmentName: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  statusName: string;
  statusColor: string;
  lastLogin: string | null;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  roles: Role[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: PermissionSet;
  userCount: number;
  createdAt: string;
}

interface PermissionSet {
  all?: string[];
  [resource: string]: string[] | undefined;
}

// =====================================================
// Order Types
// =====================================================

interface PrintingOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerTypeId: number;
  customerTypeName: string;
  customerTypeColor: string;
  productType: 'Book' | 'Module' | 'Exam' | 'Brochure' | 'TaxReceipt';
  quantity: number;
  paperType: 'A3' | 'A4' | 'A5';
  pagesPerCopy: number;
  colorPrinting: boolean;
  bindingType: 'None' | 'Spiral' | 'Thermal';
  dueDate: string;
  specialInstructions: string;
  attachments: Attachment[];
  pricePerUnit: number;
  bindingCost: number;
  totalPrice: number;
  status: 'received' | 'in_progress' | 'quality_check' | 'ready' | 'delivered' | 'cancelled';
  statusName: string;
  statusColor: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderStatusHistory[];
}

interface OrderStatusHistory {
  id: number;
  fromStatus: string;
  toStatus: string;
  note: string;
  changedBy: number;
  changedByName: string;
  changedAt: string;
  ipAddress: string;
}

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  uploadedBy: number;
  uploadedAt: string;
}

// =====================================================
// Customer Types
// =====================================================

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  customerTypeId: number;
  customerTypeName: string;
  customerTypeColor: string;
  address: string;
  taxId: string;
  creditLimit: number;
  currentBalance: number;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
}

// =====================================================
// Product & Inventory Types
// =====================================================

interface Product {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  unitId: number;
  unitName: string;
  unitAbbr: string;
  sellingPrice: number;
  reorderLevel: number;
  expiryDate: string | null;
  supplierId: number | null;
  supplierName: string;
  isActive: boolean;
  currentStock: number;
  averageCost: number;
  storageLocation: string;
  lastCounted: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  transactionType: 'Sale' | 'Purchase' | 'Adjustment' | 'Damaged' | 'Lost' | 'Expired';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  reason: string;
  performedBy: number;
  performedByName: string;
  createdAt: string;
}

// =====================================================
// Purchase Order Types
// =====================================================

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  orderDate: string;
  expectedDeliveryDate: string;
  sectorId: number;
  sectorName: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent' | 'partial_received' | 'complete' | 'cancelled';
  statusName: string;
  statusColor: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string;
  items: PurchaseOrderItem[];
  approvedBy: number | null;
  approvedByName: string;
  approvedAt: string | null;
  createdAt: string;
}

interface PurchaseOrderItem {
  id: number;
  productId: number | null;
  productName: string;
  quantityOrdered: number;
  unitPrice: number;
  total: number;
  quantityReceived: number;
  quantityDamaged: number;
  qualityPass: boolean | null;
}

// =====================================================
// POS Types
// =====================================================

interface PosSale {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethodId: number;
  paymentMethodName: string;
  paymentReference: string;
  amountPaid: number;
  changeAmount: number;
  cashierId: number;
  cashierName: string;
  saleDate: string;
  status: 'completed' | 'voided' | 'refunded';
  items: PosSaleItem[];
}

interface PosSaleItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
  total: number;
}

interface Cart {
  items: CartItem[];
  discount: {
    type: 'percentage' | 'fixed' | null;
    value: number;
    reason?: string;
  };
}

interface CartItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// =====================================================
// Finance Types
// =====================================================

interface Expense {
  id: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  date: string;
  description: string;
  paymentMethodId: number;
  paymentMethodName: string;
  referenceNumber: string;
  receiptPath: string;
  enteredBy: number;
  enteredByName: string;
  approvedBy: number | null;
  approvedByName: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  requiresApproval: boolean;
  createdAt: string;
}

interface Payment {
  id: number;
  referenceType: 'PO' | 'Invoice';
  referenceId: number;
  referenceNumber: string;
  partyName: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processedBy: number;
  processedByName: string;
  processedAt: string;
}

// =====================================================
// API Response Types
// =====================================================

interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  message: string;
  data?: T;
  errors?: ApiError[];
  timestamp: string;
}

interface ApiError {
  field: string;
  message: string;
  value?: any;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =====================================================
// Auth Types
// =====================================================

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

// =====================================================
// Report Types
// =====================================================

interface SalesReport {
  date: string;
  sales: PosSale[];
  summary: SalesSummary;
}

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  averageOrderValue: number;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
}

interface ProfitLossStatement {
  period: { startDate: string; endDate: string };
  revenue: {
    sales: number;
    printing: number;
    total: number;
  };
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  profitMargin: string;
}

// =====================================================
// Dashboard Types
// =====================================================

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  recentOrders: PrintingOrder[];
}

interface CEODashboard {
  summary: {
    totalRevenue: number;
    revenueTrend: 'up' | 'down';
    netProfit: number;
    profitMargin: number;
    cashFlow: number;
  };
  revenue: RevenueMetrics;
  profit: ProfitMetrics;
  kpis: KpiMetrics;
  alerts: Alert[];
}

interface RevenueMetrics {
  period: string;
  current: { amount: number; vsPrevious: number; trend: 'up' | 'down' };
}

interface ProfitMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
}

interface KpiMetrics {
  salesTarget: { actual: number; target: number; status: 'green' | 'yellow' | 'red' };
  fulfillmentTime: { actual: number; target: number; status: 'green' | 'yellow' | 'red' };
  inventoryTurnover: { actual: number; target: number; status: 'green' | 'yellow' | 'red' };
  customerSatisfaction: { actual: number; target: number; status: 'green' | 'yellow' | 'red' };
}

interface Alert {
  id: string;
  type: 'inventory' | 'finance' | 'approval' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionUrl: string;
  createdAt: string;
}

// =====================================================
// Supplier Types
// =====================================================

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTermsId: number | null;
  paymentTermsName: string;
  leadTimeDays: number;
  taxId: string;
  bankAccount: string;
  isActive: boolean;
  poCount: number;
  totalSpent: number;
  outstandingBalance: number;
  createdAt: string;
}

// =====================================================
// Tax Receipt Types
// =====================================================

interface TaxReceipt {
  id: number;
  serialNumber: string;
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerTypeId: number;
  customerTypeName: string;
  approvalAmountTotal: number;
  usedCount: number;
  remaining: number;
  approvedDate: string;
  approvalDocument: string;
  printedBy: number;
  printedByName: string;
  printedAt: string;
}

// =====================================================
// Notification Types
// =====================================================

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

interface SmsOptions {
  to: string | string[];
  message: string;
  senderId?: string;
}

// =====================================================
// Cache Types
// =====================================================

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

// =====================================================
// Job Types
// =====================================================

interface JobStatus {
  name: string;
  schedule: string;
  enabled: boolean;
  running: boolean;
  nextRun: string | null;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    cpu: CpuHealth;
    memory: MemoryHealth;
    disk: DiskHealth;
    api: ApiHealth;
  };
  issues: HealthIssue[];
  responseTime: number;
}

interface ServiceHealth {
  healthy: boolean;
  responseTime: number;
  error?: string;
}

interface CpuHealth {
  healthy: boolean;
  usagePercent: string;
  loadAvg: { '1min': string; '5min': string; '15min': string };
  cores: number;
}

interface MemoryHealth {
  healthy: boolean;
  usagePercent: string;
  total: string;
  free: string;
  used: string;
}

interface DiskHealth {
  healthy: boolean;
  usagePercent: string;
  total: string;
  free: string;
  used: string;
}

interface ApiHealth {
  healthy: boolean;
  responseTime: number;
  isSlow: boolean;
}

interface HealthIssue {
  service: string;
  error?: string;
  details: any;
}

// =====================================================
// Config Types
// =====================================================

interface AppConfig {
  env: string;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  port: number;
  frontendUrl: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  session: SessionConfig;
  rateLimit: RateLimitConfig;
  businessRules: BusinessRules;
  logging: LoggingConfig;
}

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  pool: { min: number; max: number };
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  algorithm: string;
}

interface SessionConfig {
  timeoutMinutes: number;
  maxConcurrentSessions: number;
  maxFailedAttempts: number;
  lockoutMinutes: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface BusinessRules {
  taxRate: number;
  cashierMaxDiscount: number;
  managerMaxDiscount: number;
  ceoMaxDiscount: number;
  highValuePoThreshold: number;
}

interface LoggingConfig {
  level: string;
  dir: string;
  logSqlQueries: boolean;
}

// =====================================================
// Utility Types
// =====================================================

type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type SortOrder = 'ASC' | 'DESC';

type DateRange = {
  startDate: string;
  endDate: string;
};

type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
};

// =====================================================
// Export declarations
// =====================================================

declare module '*.types' {
  export * from './index';
}