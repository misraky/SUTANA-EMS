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

    console.log('Creating cars table...');
    await conn.query(`
        CREATE TABLE IF NOT EXISTS cars (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            daily_rate DECIMAL(10,2) DEFAULT 0,
            seats INT DEFAULT 4,
            transmission VARCHAR(50) DEFAULT 'Manual',
            fuel_type VARCHAR(50) DEFAULT 'Petrol',
            car_type VARCHAR(50) DEFAULT 'Sedan',
            description TEXT DEFAULT NULL,
            availability VARCHAR(50) DEFAULT 'Available',
            image1 VARCHAR(255) DEFAULT NULL,
            image2 VARCHAR(255) DEFAULT NULL,
            image3 VARCHAR(255) DEFAULT NULL,
            image4 VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL DEFAULT NULL
        )
    `);
    console.log('✅ Created cars table.');

    await conn.end();
    console.log('Database migration complete.');
}

run().catch(console.error);
