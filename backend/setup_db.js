const { db } = require('./src/config/database');

(async () => {
  try {
    // 1. Alter rental_orders
    const columns = [
      'extension_fee DECIMAL(10,2) DEFAULT 0',
      'damage_fee DECIMAL(10,2) DEFAULT 0',
      'fuel_fee DECIMAL(10,2) DEFAULT 0',
      'late_fee DECIMAL(10,2) DEFAULT 0',
      'refund_amount DECIMAL(10,2) DEFAULT 0',
      'additional_owed DECIMAL(10,2) DEFAULT 0',
      'actual_return_time DATETIME DEFAULT NULL',
      'actual_return_odometer INT DEFAULT NULL',
      'extended_return_date DATETIME DEFAULT NULL'
    ];
    for (const col of columns) {
      try {
        await db.raw('ALTER TABLE rental_orders ADD COLUMN ' + col);
        console.log('Added ' + col);
      } catch (e) {
        console.log('Skipped ' + col + ' (' + e.message + ')');
      }
    }

    // 2. Create notifications table
    await db.raw(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        role_target VARCHAR(50) NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created notifications table');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
