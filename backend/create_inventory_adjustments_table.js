const mysql = require('mysql2/promise');
const DB = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems',
    multipleStatements: true
};

async function run() {
    const conn = await mysql.createConnection(DB);
    console.log('\n✅ Connected to database.\n');

    const sql = `CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        quantity_change INT NOT NULL,
        reason TEXT NOT NULL,
        reference_type VARCHAR(50) DEFAULT 'Adjustment',
        reference_id INT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        requested_by INT NOT NULL,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        rejection_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    )`;

    try {
        await conn.execute(sql);
        console.log(`  ✅ Table 'inventory_adjustments' is ready.`);
    } catch (e) {
        console.error(`  ❌ Failed: ${e.message}`);
    }
    await conn.end();
}

run().catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
});
