const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('Connecting to database...');
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sutana_ems'
    });

    console.log('Adding requires_serial to products...');
    try {
        await conn.query(`
            ALTER TABLE products 
            ADD COLUMN requires_serial BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Added requires_serial to products.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('✅ requires_serial already exists.');
        } else {
            throw e;
        }
    }

    console.log('Adding model_number to inventory_movements...');
    try {
        await conn.query(`
            ALTER TABLE inventory_movements 
            ADD COLUMN model_number INT DEFAULT NULL
        `);
        console.log('✅ Added model_number to inventory_movements.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('✅ model_number already exists.');
        } else {
            throw e;
        }
    }

    console.log('Creating inventory_serials table...');
    await conn.query(`
        CREATE TABLE IF NOT EXISTS inventory_serials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            serial_number VARCHAR(100) NOT NULL,
            status ENUM('In Stock', 'Sold', 'Damaged', 'Lost') DEFAULT 'In Stock',
            location VARCHAR(255) DEFAULT NULL,
            reference_type VARCHAR(50) DEFAULT NULL,
            reference_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE KEY uk_product_serial (product_id, serial_number)
        )
    `);
    console.log('✅ Created inventory_serials table.');

    await conn.end();
    console.log('Database migration complete.');
}

run().catch(console.error);
