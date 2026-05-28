const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
}).promise();

async function fixTable() {
    try {
        console.log('Adding ip_address to support_tickets table...');
        await pool.execute(`
            ALTER TABLE support_tickets 
            ADD COLUMN ip_address VARCHAR(45) NULL AFTER customer_id
        `);
        console.log('✅ Column ip_address added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('❌ Error altering table:', error);
        }
    } finally {
        process.exit(0);
    }
}

fixTable();
