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

    const tables = [
        {
            name: 'payment_statuses',
            sql: `CREATE TABLE IF NOT EXISTS payment_statuses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                status_code VARCHAR(50) NOT NULL UNIQUE,
                status_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
        },
        {
            name: 'invoice_payments',
            sql: `CREATE TABLE IF NOT EXISTS invoice_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method_id INT NULL,
                reference_number VARCHAR(100) NULL,
                status_id INT NULL,
                processed_by INT NULL,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE,
                FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
                FOREIGN KEY (status_id) REFERENCES payment_statuses(id),
                FOREIGN KEY (processed_by) REFERENCES users(id)
            )`
        },
        {
            name: 'po_payments',
            sql: `CREATE TABLE IF NOT EXISTS po_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                po_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method_id INT NULL,
                reference_number VARCHAR(100) NULL,
                status_id INT NULL,
                processed_by INT NULL,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
                FOREIGN KEY (status_id) REFERENCES payment_statuses(id),
                FOREIGN KEY (processed_by) REFERENCES users(id)
            )`
        }
    ];

    console.log('🔍 Checking and creating missing tables...\n');
    for (const t of tables) {
        try {
            await conn.execute(t.sql);
            console.log(`  ✅ Table '${t.name}' is ready.`);
        } catch (e) {
            console.error(`  ❌ Failed on '${t.name}': ${e.message}`);
        }
    }

    // Seed payment_statuses
    console.log('\n🔍 Seeding payment_statuses...');
    const statuses = [
        ['completed', 'Completed'],
        ['pending',   'Pending'],
        ['failed',    'Failed'],
        ['refunded',  'Refunded']
    ];
    for (const [code, name] of statuses) {
        try {
            await conn.execute(
                'INSERT IGNORE INTO payment_statuses (status_code, status_name) VALUES (?, ?)',
                [code, name]
            );
            console.log(`  ✅ Status '${code}' ensured.`);
        } catch (e) {
            console.error(`  ❌ Failed seeding '${code}': ${e.message}`);
        }
    }

    // Ensure Credit payment method exists
    console.log('\n🔍 Checking payment methods...');
    const [methods] = await conn.execute('SELECT id, name FROM payment_methods');
    console.log('  Current:', methods.map(m => `[${m.id}] ${m.name}`).join(', '));

    const creditExists = methods.find(m => m.name === 'Credit');
    if (!creditExists) {
        await conn.execute(
            'INSERT INTO payment_methods (name, requires_reference, is_active) VALUES (?, ?, ?)',
            ['Credit', false, true]
        );
        const [[{ id }]] = await conn.execute("SELECT id FROM payment_methods WHERE name='Credit'");
        console.log(`  ✅ "Credit" added with id=${id}.`);
    } else {
        console.log(`  ✅ "Credit" already exists (id=${creditExists.id}).`);
    }

    await conn.end();
    console.log('\n🎉 All done! Your database is fully ready.\n');
}

run().catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
});
