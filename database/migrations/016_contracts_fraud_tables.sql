-- =============================================================
-- Migration 016: Contracts & Fraud Detection Tables
-- ERP Purchase Order Industry Standard - Dim 3 & Dim 14
-- =============================================================

-- Contracts table (Dim 3: Sourcing & Contract Management)
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contract_number` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `supplier_id` INT NOT NULL,
  `type` ENUM('quantity', 'value', 'service', 'framework') NOT NULL DEFAULT 'quantity',
  `total_value` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `consumed_value` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `start_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `days_until_expiry` INT GENERATED ALWAYS AS (DATEDIFF(expiry_date, CURDATE())) STORED,
  `status` ENUM('draft', 'active', 'full', 'expired', 'cancelled') NOT NULL DEFAULT 'draft',
  `notes` TEXT,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contract items (release orders consume from contracts)
CREATE TABLE IF NOT EXISTS `contract_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contract_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `quantity_committed` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `quantity_consumed` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fraud alert rules
CREATE TABLE IF NOT EXISTS `fraud_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `config` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fraud detection alerts
CREATE TABLE IF NOT EXISTS `fraud_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rule_id` INT DEFAULT NULL,
  `rule_name` VARCHAR(100) NOT NULL,
  `supplier_id` INT DEFAULT NULL,
  `supplier_name` VARCHAR(255) DEFAULT NULL,
  `po_id` INT DEFAULT NULL,
  `amount` DECIMAL(15,2) DEFAULT 0,
  `risk_level` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `description` TEXT,
  `status` ENUM('new', 'in_review', 'investigating', 'resolved', 'ignored', 'overridden') NOT NULL DEFAULT 'new',
  `resolved_by` INT DEFAULT NULL,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rule_id`) REFERENCES `fraud_rules`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default fraud detection rules
INSERT INTO `fraud_rules` (`name`, `description`, `severity`, `config`) VALUES
('Duplicate PO', 'Same supplier, same items, similar total amount within configurable days', 'critical', '{"lookback_days": 30, "amount_tolerance_pct": 5}'),
('Split Purchase', 'Multiple POs to same supplier totalling above threshold within 7 days', 'critical', '{"lookback_days": 7, "threshold": 50000}'),
('Price Variance', 'PO price significantly above last purchase price for same product', 'medium', '{"variance_pct": 20, "lookback_purchases": 3}'),
('Ghost Supplier', 'New supplier with rush PO and potential employee address match', 'critical', '{"new_supplier_days": 30}'),
('Single Bidder', 'RFQ with only 1 quotation received without justification override', 'medium', '{}'),
('After-Hours Pattern', 'PO created outside business hours with high value and no attachment', 'medium', '{"after_hour_start": 20, "after_hour_end": 6, "threshold": 100000}'),
('Same IP Buyer-Supplier', 'PO creator and supplier portal user share IP address', 'critical', '{"lookback_days": 90}');

-- Migration tracking
INSERT INTO `migrations` (`name`, `applied_at`) VALUES ('016_contracts_fraud_tables', NOW());
