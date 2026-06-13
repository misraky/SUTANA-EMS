-- 1. CATEGORIES table (with images)
CREATE TABLE IF NOT EXISTS pharmacy_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    cover_image VARCHAR(255),
    icon_class VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MEDICATIONS table (with drug image + cover image)
CREATE TABLE IF NOT EXISTS pharmacy_medications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    category_id INT NOT NULL,
    manufacturer VARCHAR(200),
    price DECIMAL(10,2) NOT NULL,
    price_unit VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    drug_image VARCHAR(255),
    cover_image VARCHAR(255),
    description TEXT,
    dosage_info TEXT,
    expiry_date DATE,
    is_prescription_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES pharmacy_categories(id)
);

-- 3. PHARMACY BRANCHES table
CREATE TABLE IF NOT EXISTS pharmacy_branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    alternate_phone VARCHAR(50),
    working_hours_monday_saturday VARCHAR(100),
    working_hours_sunday VARCHAR(100),
    emergency_phone VARCHAR(50),
    delivery_support_phone VARCHAR(50),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    cover_image VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. STOCK MOVEMENTS (track changes)
CREATE TABLE IF NOT EXISTS pharmacy_stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medication_id INT NOT NULL,
    quantity_change INT NOT NULL,
    reason VARCHAR(100),
    reference_no VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES pharmacy_medications(id)
);

-- SEED DATA
INSERT IGNORE INTO pharmacy_categories (id, name, slug, description, icon_class, display_order) VALUES
(1, 'Prescription Drugs (Rx)', 'prescription-drugs', 'Medications that require a doctor''s prescription', 'fa-prescription-bottle', 1),
(2, 'Over-the-Counter (OTC)', 'over-the-counter', 'Medications you can buy without a prescription', 'fa-pills', 2),
(3, 'Vitamins & Supplements', 'vitamins-supplements', 'Vitamins, minerals, and dietary supplements', 'fa-leaf', 3),
(4, 'Baby & Maternity', 'baby-maternity', 'Products for babies, toddlers, and expecting mothers', 'fa-baby', 4);

INSERT IGNORE INTO pharmacy_medications (id, name, generic_name, category_id, manufacturer, price, price_unit, stock_quantity, reorder_level, description, dosage_info, expiry_date, is_prescription_required) VALUES
(1, 'Amoxicillin 500mg Capsule', 'Amoxicillin Trihydrate', 1, 'ABC Pharmaceuticals', 120.00, 'per strip (10 capsules)', 45, 10, 'Amoxicillin is a penicillin-type antibiotic used to treat a wide variety of bacterial infections.', 'Take 1 capsule every 8 hours for 7 days.', '2027-12-31', TRUE),
(2, 'Paracetamol 500mg Tablet', 'Acetaminophen', 2, 'HealthCare Inc', 25.00, 'per strip (10 tablets)', 120, 20, 'Pain reliever and a fever reducer.', 'Take 1-2 tablets every 4 to 6 hours as needed.', '2028-05-31', FALSE),
(3, 'Insulin Glargine', 'Insulin Glargine', 1, 'Novo Nordisk', 850.00, 'per vial', 8, 15, 'Long-acting insulin used to treat diabetes mellitus.', 'Use as directed by your physician.', '2026-10-31', TRUE),
(4, 'Vitamin C 1000mg', 'Ascorbic Acid', 3, 'NutraLife', 150.00, 'per bottle (30 tablets)', 60, 10, 'Dietary supplement to boost immunity.', 'Take 1 tablet daily with food.', '2027-08-31', FALSE);

INSERT IGNORE INTO pharmacy_branches (id, branch_name, address, phone, working_hours_monday_saturday, working_hours_sunday, emergency_phone, delivery_support_phone) VALUES
(1, 'Main Branch', 'Bole Road, Addis Ababa', '011-123-4567', '8:00 AM - 8:00 PM', '10:00 AM - 6:00 PM', '0911-234567', '0922-123456'),
(2, 'Piassa Branch', 'Piassa, Addis Ababa', '011-987-6543', '8:00 AM - 8:00 PM', 'Closed', '0911-234567', '0922-123456');
