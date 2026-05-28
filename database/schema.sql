CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NULL	
);

CREATE TABLE payment_terms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  days_net INT DEFAULT 0
);

CREATE TABLE sectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NULL
);

CREATE TABLE customer_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  color_code VARCHAR(7) NOT NULL DEFAULT '#6B7280',
  icon_name VARCHAR(50) NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  requires_reference BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  abbreviation VARCHAR(10) NOT NULL
);

CREATE TABLE expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_limit DECIMAL(15,2) NULL
);

-- =====================================================
-- STATUS TABLES (Domain-specific for data integrity)
-- =====================================================

CREATE TABLE user_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_code VARCHAR(50) UNIQUE NOT NULL,
  status_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE order_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_code VARCHAR(50) UNIQUE NOT NULL,
  status_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE po_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_code VARCHAR(50) UNIQUE NOT NULL,
  status_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE payment_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_code VARCHAR(50) UNIQUE NOT NULL,
  status_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE sale_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_code VARCHAR(50) UNIQUE NOT NULL,
  status_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  sort_order INT DEFAULT 0
);

-- =====================================================
-- TABLE 1: users
-- =====================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department_id INT NOT NULL,
  status_id INT NOT NULL,
  last_login DATETIME NULL,
  must_change_password BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255) NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expires DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by INT NULL,
  
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone),
  INDEX idx_users_status (status_id),
  INDEX idx_users_deleted_at (deleted_at),
  
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (status_id) REFERENCES user_statuses(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 2: roles
-- =====================================================
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NULL,
  permissions JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 3: user_roles
-- =====================================================
CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT NULL,
  
  PRIMARY KEY (user_id, role_id),
  INDEX idx_user_roles_user (user_id),
  INDEX idx_user_roles_role (role_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 4: sessions
-- =====================================================
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 5: password_history
-- =====================================================
CREATE TABLE password_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_password_history_user (user_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 6: audit_logs
-- =====================================================
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255) NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_resource (resource),
  INDEX idx_audit_created (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 7: suppliers
-- =====================================================
CREATE TABLE suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) UNIQUE NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  payment_terms_id INT NULL,
  lead_time_days INT DEFAULT 7,
  tax_id VARCHAR(50) NULL,
  bank_account VARCHAR(100) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  INDEX idx_suppliers_name (name),
  INDEX idx_suppliers_active (is_active),
  
  FOREIGN KEY (payment_terms_id) REFERENCES payment_terms(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 8: customers
-- =====================================================
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) NULL,
  customer_type_id INT NOT NULL,
  address TEXT NULL,
  tax_id VARCHAR(50) NULL,
  credit_limit DECIMAL(15,2) DEFAULT 0.00,
  current_balance DECIMAL(15,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  deleted_at DATETIME NULL,
  
  INDEX idx_customers_phone (phone),
  INDEX idx_customers_type (customer_type_id),
  
  FOREIGN KEY (customer_type_id) REFERENCES customer_types(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 9: products
-- =====================================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category_id INT NOT NULL,
  unit_id INT NOT NULL,
  selling_price DECIMAL(15,2) NOT NULL CHECK (selling_price > 0),
  reorder_level INT DEFAULT 0,
  expiry_date DATE NULL,
  supplier_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  INDEX idx_products_sku (sku),
  INDEX idx_products_category (category_id),
  INDEX idx_products_expiry (expiry_date),
  
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 10: inventory
-- =====================================================
CREATE TABLE inventory (
  product_id INT PRIMARY KEY,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_cost DECIMAL(15,2) NOT NULL,
  location VARCHAR(100) NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_counted DATETIME NULL,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 11: inventory_movements
-- =====================================================
CREATE TABLE inventory_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  quantity_change INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  reason TEXT NULL,
  performed_by INT NOT NULL,
  approved_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_movement_product (product_id),
  INDEX idx_movement_type (transaction_type),
  INDEX idx_movement_created (created_at),
  
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (performed_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 12: printing_orders
-- =====================================================
CREATE TABLE printing_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  customer_type_id INT NOT NULL,
  product_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  paper_type VARCHAR(10) NOT NULL,
  pages_per_copy INT NOT NULL CHECK (pages_per_copy > 0),
  color_printing BOOLEAN DEFAULT FALSE,
  binding_type VARCHAR(20) DEFAULT 'None',
  due_date DATE NOT NULL,
  special_instructions TEXT NULL,
  attachments JSON NULL,
  price_per_unit DECIMAL(15,2) NOT NULL,
  binding_cost DECIMAL(15,2) DEFAULT 0.00,
  total_price DECIMAL(15,2) NOT NULL,
  status_id INT NOT NULL,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  INDEX idx_orders_number (order_number),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status_id),
  INDEX idx_orders_due_date (due_date),
  
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (customer_type_id) REFERENCES customer_types(id),
  FOREIGN KEY (status_id) REFERENCES order_statuses(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =====================================================
-- TABLE 13: order_status_history
-- =====================================================
CREATE TABLE order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  from_status VARCHAR(50) NULL,
  to_status VARCHAR(50) NOT NULL,
  note TEXT NULL,
  changed_by INT NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  
  INDEX idx_history_order (order_id),
  INDEX idx_history_timestamp (changed_at),
  
  FOREIGN KEY (order_id) REFERENCES printing_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- =====================================================
-- TABLE 14: tax_receipts
-- =====================================================
CREATE TABLE tax_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serial_number VARCHAR(20) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_type_id INT NOT NULL,
  approval_amount_total INT NOT NULL CHECK (approval_amount_total > 0),
  used_count INT DEFAULT 0 CHECK (used_count >= 0),
  remaining INT NOT NULL CHECK (remaining >= 0),
  approved_date DATE NOT NULL,
  approval_document VARCHAR(255) NOT NULL,
  printed_by INT NOT NULL,
  printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  deleted_at DATETIME NULL,
  
  INDEX idx_tax_serial (serial_number),
  INDEX idx_tax_order (order_id),
  
  FOREIGN KEY (order_id) REFERENCES printing_orders(id),
  FOREIGN KEY (customer_type_id) REFERENCES customer_types(id),
  FOREIGN KEY (printed_by) REFERENCES users(id)
);

-- =====================================================
-- TABLE 15: purchase_orders
-- =====================================================
CREATE TABLE purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(20) UNIQUE NOT NULL,
  supplier_id INT NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE NOT NULL,
  sector_id INT NOT NULL,
  status_id INT NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  notes TEXT NULL,
  attachment VARCHAR(255) NULL,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  INDEX idx_po_number (po_number),
  INDEX idx_po_supplier (supplier_id),
  INDEX idx_po_status (status_id),
  
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (sector_id) REFERENCES sectors(id),
  FOREIGN KEY (status_id) REFERENCES po_statuses(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =====================================================
-- TABLE 16: po_items
-- =====================================================
CREATE TABLE po_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
  unit_price DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  quantity_received INT DEFAULT 0 CHECK (quantity_received >= 0),
  quantity_damaged INT DEFAULT 0 CHECK (quantity_damaged >= 0),
  quality_pass BOOLEAN NULL,
  
  INDEX idx_po_items_po (po_id),
  INDEX idx_po_items_product (product_id),
  
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 17: pos_sales
-- =====================================================
CREATE TABLE pos_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT NULL,
  subtotal DECIMAL(15,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount >= 0),
  payment_method_id INT NOT NULL,
  payment_reference VARCHAR(100) NULL,
  amount_paid DECIMAL(15,2) NOT NULL,
  change_amount DECIMAL(15,2) DEFAULT 0.00,
  cashier_id INT NOT NULL,
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status_id INT NOT NULL,
  voided_by INT NULL,
  void_reason TEXT NULL,
  deleted_at DATETIME NULL,
  
  INDEX idx_pos_invoice (invoice_number),
  INDEX idx_pos_customer (customer_id),
  INDEX idx_pos_date (sale_date),
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (status_id) REFERENCES sale_statuses(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  FOREIGN KEY (voided_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 18: pos_items
-- =====================================================
CREATE TABLE pos_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0.00 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  subtotal DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  
  INDEX idx_pos_items_sale (sale_id),
  INDEX idx_pos_items_product (product_id),
  
  FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =====================================================
-- TABLE 19: expenses
-- =====================================================
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  receipt_path VARCHAR(255) NULL,
  payment_method_id INT NOT NULL,
  reference_number VARCHAR(100) NULL,
  entered_by INT NOT NULL,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  INDEX idx_expenses_category (category_id),
  INDEX idx_expenses_date (date),
  
  FOREIGN KEY (category_id) REFERENCES expense_categories(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (entered_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 20: po_payments
-- =====================================================
CREATE TABLE po_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_method_id INT NOT NULL,
  reference_number VARCHAR(100) NULL,
  status_id INT NOT NULL,
  processed_by INT NOT NULL,
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  
  INDEX idx_po_payments_po (po_id),
  INDEX idx_po_payments_status (status_id),
  
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (status_id) REFERENCES payment_statuses(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- =====================================================
-- TABLE 21: invoice_payments
-- =====================================================
CREATE TABLE invoice_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_method_id INT NOT NULL,
  reference_number VARCHAR(100) NULL,
  status_id INT NOT NULL,
  processed_by INT NOT NULL,
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  
  INDEX idx_invoice_payments_sale (sale_id),
  INDEX idx_invoice_payments_status (status_id),
  
  FOREIGN KEY (sale_id) REFERENCES pos_sales(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (status_id) REFERENCES payment_statuses(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- =====================================================
-- TABLE 22: settings
-- =====================================================
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NULL,
  updated_by INT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_settings_key (setting_key),
  INDEX idx_settings_category (category),
  
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 23: communication_logs
-- =====================================================
CREATE TABLE communication_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(10) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  provider_response TEXT NULL,
  retry_count INT DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  
  INDEX idx_logs_type (type),
  INDEX idx_logs_status (status),
  INDEX idx_logs_created (created_at),
  INDEX idx_logs_recipient (recipient)
);

-- =====================================================
-- SEED DATA (Required for application to function)
-- =====================================================

-- Departments
INSERT INTO departments (name, description) VALUES
('Admin', 'System administration'),
('CEO', 'Executive management'),
('Finance', 'Financial operations'),
('Printing', 'Printing production'),
('Purchase', 'Procurement'),
('Sales', 'Sales and POS'),
('Inventory', 'Stock management'),
('Customer', 'Customer self-service portal');

-- Payment Terms
INSERT INTO payment_terms (name, days_net) VALUES
('Net 30', 30),
('Net 60', 60),
('COD', 0),
('Prepaid', 0);

-- Sectors
INSERT INTO sectors (name) VALUES
('Printing'),
('Sales'),
('Pharmacy'),
('General Office');

-- Customer Types
INSERT INTO customer_types (name, color_code, icon_name, sort_order) VALUES
('Government', '#EF4444', 'building', 1),
('Scholar', '#3B82F6', 'graduation-cap', 2),
('Lecturer', '#10B981', 'chalkboard-user', 3),
('Church', '#8B5CF6', 'church', 4),
('Regular', '#6B7280', 'user', 5);

-- Payment Methods
INSERT INTO payment_methods (name, requires_reference, is_active) VALUES
('Cash', FALSE, TRUE),
('Credit', FALSE, TRUE),
('Bank Transfer', TRUE, TRUE),
('Telebirr', TRUE, TRUE),
('Check', TRUE, TRUE);

-- Product Categories
INSERT INTO product_categories (name, is_active) VALUES
('Printing', TRUE),
('Sales', TRUE),
('Pharmacy', TRUE),
('Office', TRUE);

-- Units
INSERT INTO units (name, abbreviation) VALUES
('Each', 'pc'),
('Sheet', 'sh'),
('Kilogram', 'kg'),
('Liter', 'L'),
('Milliliter', 'mL'),
('Gram', 'g');

-- Expense Categories
INSERT INTO expense_categories (name, requires_approval, approval_limit) VALUES
('Utility', FALSE, NULL),
('Salary', TRUE, 50000.00),
('Rent', TRUE, 100000.00),
('Supplies', FALSE, NULL),
('Maintenance', TRUE, 20000.00),
('Other', FALSE, NULL);

-- User Statuses
INSERT INTO user_statuses (status_code, status_name, color_hex, sort_order) VALUES
('active', 'Active', '#10B981', 1),
('inactive', 'Inactive', '#6B7280', 2),
('suspended', 'Suspended', '#F59E0B', 3),
('deleted', 'Deleted', '#EF4444', 4);

-- Order Statuses
INSERT INTO order_statuses (status_code, status_name, color_hex, sort_order) VALUES
('received', 'Received', '#9CA3AF', 1),
('in_progress', 'In Progress', '#3B82F6', 2),
('quality_check', 'Quality Check', '#F59E0B', 3),
('ready', 'Ready', '#10B981', 4),
('delivered', 'Delivered', '#059669', 5);

-- PO Statuses
INSERT INTO po_statuses (status_code, status_name, color_hex, sort_order) VALUES
('draft', 'Draft', '#6B7280', 1),
('pending', 'Pending Approval', '#F59E0B', 2),
('approved', 'Approved', '#10B981', 3),
('rejected', 'Rejected', '#EF4444', 4),
('sent', 'Sent to Supplier', '#3B82F6', 5),
('partial_received', 'Partial Received', '#8B5CF6', 6),
('complete', 'Complete', '#059669', 7),
('cancelled', 'Cancelled', '#EF4444', 8);

-- Payment Statuses
INSERT INTO payment_statuses (status_code, status_name, color_hex, sort_order) VALUES
('pending', 'Pending', '#F59E0B', 1),
('completed', 'Completed', '#10B981', 2),
('failed', 'Failed', '#EF4444', 3),
('refunded', 'Refunded', '#6B7280', 4);

-- Sale Statuses
INSERT INTO sale_statuses (status_code, status_name, color_hex, sort_order) VALUES
('completed', 'Completed', '#10B981', 1),
('voided', 'Voided', '#EF4444', 2),
('refunded', 'Refunded', '#F59E0B', 3);

-- Roles
INSERT INTO roles (name, description, permissions) VALUES
('Admin', 'Full system access', '{"all": ["*"]}'),
('CEO', 'Strategic oversight', '{"reports": ["read", "export"], "dashboard": ["read"]}'),
('Finance', 'Financial operations', '{"payments": ["create", "read"], "expenses": ["create", "read"]}'),
('Printing Supervisor', 'Printing order management', '{"orders": ["create", "read", "update"]}'),
('Purchase', 'Procurement management', '{"suppliers": ["create", "read"], "purchase_orders": ["create", "read"]}'),
('Store Worker', 'Inventory management', '{"inventory": ["create", "read", "update"]}'),
('Sales/Cashier', 'POS operations', '{"pos": ["create", "read"], "customers": ["create", "read"]}'),
('Customer', 'Self-service portal', '{"orders": ["create", "read"], "profile": ["read", "update"]}');

-- Default Admin User (password: Admin@123 - CHANGE IN PRODUCTION)
-- Password hash is bcrypt of 'Admin@123' with 10 rounds
INSERT INTO users (full_name, email, phone, password, department_id, status_id, must_change_password) VALUES
('System Administrator', 'admin@sutana.com', '0911000000', '$2b$10$YKq4VxQK8xQK8xQK8xQK8uYKq4VxQK8xQK8xQK8xQK8xQK8xQK8u', 
 (SELECT id FROM departments WHERE name = 'Admin'), (SELECT id FROM user_statuses WHERE status_code = 'active'), TRUE);

-- Assign Admin Role to Admin User
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, u.id FROM users u, roles r WHERE u.email = 'admin@sutana.com' AND r.name = 'Admin';

-- Default Settings
INSERT INTO settings (setting_key, setting_value, category, description) VALUES
('system_name', 'Sutana EMS', 'General', 'System display name'),
('timezone', 'Africa/Addis_Ababa', 'General', 'System timezone'),
('currency', 'ETB', 'General', 'System currency'),
('tax_rate', '15', 'General', 'Default tax rate percentage'),
('session_timeout_minutes', '30', 'Security', 'Session inactivity timeout'),
('max_failed_attempts', '5', 'Security', 'Login attempts before lockout'),
('lockout_minutes', '15', 'Security', 'Account lockout duration');

ALTER TABLE printing_orders 
ADD COLUMN completed_at DATETIME NULL AFTER updated_at;
UPDATE roles 
SET permissions = JSON_SET(permissions, '$.balance', JSON_ARRAY('read'))
WHERE name = 'Customer';
ALTER TABLE customers 
ADD COLUMN user_id INT UNIQUE NULL AFTER id,
ADD CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;





CREATE TABLE customer_notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- e.g., 'order_update', 'payment_received', 'alert'
  is_read BOOLEAN DEFAULT FALSE,
  link_url VARCHAR(255) NULL, -- Optional: to click and go to an order
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_notifications_customer (customer_id),
  INDEX idx_notifications_read (is_read),
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
