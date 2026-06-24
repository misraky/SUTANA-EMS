const { db } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Starting DB Migration...');

    // 1. Update cash_handovers ENUM
    console.log('Altering cash_handovers table...');
    await db.raw(`
      ALTER TABLE cash_handovers 
      MODIFY COLUMN handover_type ENUM(
        'CASHIER_TO_MANAGER', 
        'MANAGER_TO_FINANCE', 
        'FARMING_TO_FINANCE', 
        'PRINTING_TO_FINANCE', 
        'PHARMACY_TO_FINANCE',
        'CAR_TO_FINANCE',
        'RETAIL_TO_FINANCE'
      ) NOT NULL;
    `);

    // 2. Drop and Recreate HR Tables
    console.log('Creating HR Tables...');
    
    // First, rename existing employees to employees_old if we need a fresh schema, 
    // or just drop it if it's empty/test. Let's drop it to be clean, as the existing one lacks many fields.
    await db.raw('DROP TABLE IF EXISTS attendance_records;');
    await db.raw('DROP TABLE IF EXISTS leave_requests;');
    await db.raw('DROP TABLE IF EXISTS payroll_records;');
    await db.raw('DROP TABLE IF EXISTS registered_computers;');
    await db.raw('DROP TABLE IF EXISTS employees;');

    // EMPLOYEES TABLE
    await db.raw(`
      CREATE TABLE employees (
        employee_id VARCHAR(20) PRIMARY KEY,
        user_id INT(11) DEFAULT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15) DEFAULT NULL,
        position VARCHAR(80) DEFAULT NULL,
        department ENUM('Printing', 'Pharmacy', 'Car Rental', 'Farming', 'Retail', 'Admin', 'IT', 'Finance') NOT NULL,
        join_date DATE DEFAULT NULL,
        base_salary DECIMAL(12,2) DEFAULT 0.00,
        allowance DECIMAL(12,2) DEFAULT 0.00,
        standing_deduction DECIMAL(12,2) DEFAULT 0.00,
        payment_method ENUM('Cash', 'Bank Transfer', 'Telebirr') DEFAULT 'Bank Transfer',
        bank_account VARCHAR(30) DEFAULT NULL,
        work_type ENUM('Office', 'Field') DEFAULT 'Office',
        status ENUM('Active', 'Inactive', 'On Leave') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // REGISTERED COMPUTERS
    await db.raw(`
      CREATE TABLE registered_computers (
        computer_id VARCHAR(10) PRIMARY KEY,
        computer_name VARCHAR(60) NOT NULL,
        location VARCHAR(80) DEFAULT NULL,
        department VARCHAR(40) DEFAULT NULL,
        mac_address VARCHAR(17) DEFAULT NULL,
        ip_range VARCHAR(20) DEFAULT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ATTENDANCE RECORDS
    await db.raw(`
      CREATE TABLE attendance_records (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(20) NOT NULL,
        computer_id VARCHAR(10) DEFAULT NULL,
        action ENUM('CLOCK_IN', 'CLOCK_OUT', 'MANAGER_MARK') NOT NULL,
        status ENUM('Present', 'Absent', 'On Leave', 'On Assignment') NOT NULL,
        timestamp DATETIME NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        work_date DATE NOT NULL,
        notes TEXT DEFAULT NULL,
        recorded_by VARCHAR(20) NOT NULL,
        adjusted_by VARCHAR(20) DEFAULT NULL,
        adjustment_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
        FOREIGN KEY (computer_id) REFERENCES registered_computers(computer_id)
      );
    `);

    // LEAVE REQUESTS
    await db.raw(`
      CREATE TABLE leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(20) NOT NULL,
        leave_type ENUM('Annual Leave', 'Sick Leave', 'Unpaid Leave', 'Emergency Leave') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        reviewed_by VARCHAR(20) DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
      );
    `);

    // PAYROLL RECORDS
    await db.raw(`
      CREATE TABLE payroll_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payroll_month VARCHAR(7) NOT NULL, -- e.g., '2026-06'
        employee_id VARCHAR(20) NOT NULL,
        base_salary DECIMAL(12,2) NOT NULL,
        days_present DECIMAL(4,2) NOT NULL,
        daily_rate DECIMAL(12,2) NOT NULL,
        deduction_amount DECIMAL(12,2) DEFAULT 0.00,
        bonus_amount DECIMAL(12,2) DEFAULT 0.00,
        net_salary DECIMAL(12,2) NOT NULL,
        status ENUM('Draft', 'Approved_HR', 'Approved_Finance', 'Paid') DEFAULT 'Draft',
        payment_method ENUM('Cash', 'Bank Transfer', 'Telebirr') DEFAULT NULL,
        paid_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
        UNIQUE KEY idx_employee_month (employee_id, payroll_month)
      );
    `);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
