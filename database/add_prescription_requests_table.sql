-- PRESCRIPTION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS prescription_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g. RX-001, RX-002
    
    -- Customer info
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    customer_phone VARCHAR(50),
    
    -- Medication info
    medication_id INT NOT NULL,
    medication_name VARCHAR(200),
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    
    -- Prescription upload
    prescription_image VARCHAR(255),
    
    -- Delivery
    delivery_option ENUM('pickup', 'delivery') DEFAULT 'pickup',
    delivery_address TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Status flow
    status ENUM(
        'pending',           -- Just submitted, waiting pharmacist
        'approved',          -- Pharmacist approved
        'rejected',          -- Pharmacist rejected
        'ready_for_pickup',  -- Medicine prepared
        'picked_up',         -- Customer collected
        'delivered'          -- Delivery completed
    ) DEFAULT 'pending',
    
    rejection_reason TEXT,
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_rejected_at TIMESTAMP NULL,
    ready_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (medication_id) REFERENCES pharmacy_medications(id)
);
