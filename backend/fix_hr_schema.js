const { db } = require('./src/config/database');

async function fixHR() {
  try {
    console.log('Fixing HR schema...');

    // 1. Add missing columns to employees table
    console.log('Adding missing columns to employees...');
    const empCols = await db.raw('SHOW COLUMNS FROM employees');
    const existing = empCols[0].map(c => c.Field);
    const toAdd = [
      ['password_hash', 'VARCHAR(255) NOT NULL DEFAULT ""'],
      ['check_in_time', 'TIME NOT NULL DEFAULT "08:30:00"'],
      ['check_out_time', 'TIME NOT NULL DEFAULT "17:30:00"'],
      ['lunch_break_minutes', 'INT DEFAULT 60'],
      ['work_days_per_month', 'INT DEFAULT 22'],
    ];
    for (const [col, def] of toAdd) {
      if (!existing.includes(col)) {
        await db.raw(`ALTER TABLE employees ADD COLUMN ${col} ${def}`);
        console.log(`  Added: ${col}`);
      } else {
        console.log(`  Skip: ${col} (already exists)`);
      }
    }

    // 2. Create payroll master table
    console.log('Creating payroll table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS payroll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month VARCHAR(7) NOT NULL UNIQUE,
        status ENUM('Draft','Sent','Finance Approved','Paid') DEFAULT 'Draft',
        total_base_salary DECIMAL(14,2) DEFAULT 0,
        total_bonus DECIMAL(14,2) DEFAULT 0,
        total_deduction DECIMAL(14,2) DEFAULT 0,
        total_net DECIMAL(14,2) DEFAULT 0,
        employee_count INT DEFAULT 0,
        payment_method VARCHAR(30) DEFAULT NULL,
        created_by INT DEFAULT NULL,
        sent_to_finance_at TIMESTAMP NULL,
        approved_at TIMESTAMP NULL,
        finance_approved_by INT DEFAULT NULL,
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 3. Create payroll_items table
    console.log('Creating payroll_items table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS payroll_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payroll_id INT NOT NULL,
        employee_id VARCHAR(20) NOT NULL,
        base_salary DECIMAL(12,2) DEFAULT 0,
        daily_rate DECIMAL(12,2) DEFAULT 0,
        days_present DECIMAL(4,2) DEFAULT 0,
        days_absent DECIMAL(4,2) DEFAULT 0,
        late_minutes INT DEFAULT 0,
        absence_deduction DECIMAL(12,2) DEFAULT 0,
        late_deduction DECIMAL(12,2) DEFAULT 0,
        early_leave_deduction DECIMAL(12,2) DEFAULT 0,
        standing_deduction DECIMAL(12,2) DEFAULT 0,
        overtime_hours DECIMAL(5,2) DEFAULT 0,
        overtime_pay DECIMAL(12,2) DEFAULT 0,
        performance_bonus DECIMAL(12,2) DEFAULT 0,
        net_salary DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payroll_id) REFERENCES payroll(id),
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
      );
    `);

    // 4. Create leave_types table (needed by payroll calc)
    console.log('Creating leave_types table...');
    await db.raw(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(40) NOT NULL,
        is_paid TINYINT(1) DEFAULT 1,
        max_days_per_year INT DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Seed default leave types
    const lt = await db('leave_types').count('id as c').first();
    if (parseInt(lt.c) === 0) {
      await db('leave_types').insert([
        { name: 'Annual Leave', is_paid: 1, max_days_per_year: 15 },
        { name: 'Sick Leave', is_paid: 1, max_days_per_year: 10 },
        { name: 'Unpaid Leave', is_paid: 0, max_days_per_year: 30 },
        { name: 'Emergency Leave', is_paid: 1, max_days_per_year: 3 },
      ]);
      console.log('  Seeded leave_types');
    }

    // 6. Fix leave_requests to use leave_type_id (INT) if it currently uses varchar
    const lrCols = await db.raw('SHOW COLUMNS FROM leave_requests');
    const lrExisting = lrCols[0].map(c => c.Field);
    if (!lrExisting.includes('leave_type_id')) {
      await db.raw(`ALTER TABLE leave_requests ADD COLUMN leave_type_id INT DEFAULT NULL AFTER employee_id`);
      console.log('  Added leave_type_id to leave_requests');
    }

    console.log('HR schema fix complete!');
  } catch (err) {
    console.error('Fix failed:', err.message);
  } finally {
    process.exit();
  }
}
fixHR();
