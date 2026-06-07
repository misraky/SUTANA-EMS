const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
}).promise();

async function createTable() {
    try {
        console.log('Creating customer_quotes table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS customer_quotes (
                id VARCHAR(255) PRIMARY KEY,
                customer_id INT NOT NULL,
                product_type VARCHAR(100) NOT NULL,
                quantity INT NOT NULL,
                paper_type VARCHAR(50) NOT NULL,
                pages_per_copy INT NOT NULL,
                color_printing BOOLEAN NOT NULL DEFAULT 0,
                binding_type VARCHAR(50) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                breakdown_json TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table customer_quotes created successfully.');
    } catch (error) {
        console.error('❌ Error creating table:', error);
    } finally {
        process.exit(0);
    }
}

createTable();
