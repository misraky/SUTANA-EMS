const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
}).promise();

async function run() {
    try {
        console.log('Inserting a dummy supplier and PO...');
        
        // Ensure a supplier exists
        let [suppliers] = await pool.query('SELECT id FROM suppliers LIMIT 1');
        let supplierId;
        if (suppliers.length === 0) {
            const [res] = await pool.query(`
                INSERT INTO suppliers (name, contact_person, phone, email, address, is_active) 
                VALUES ("Test Supplier Ltd.", "Supplier Contact", "0912111111", "supplier@test.com", "Addis Ababa, Ethiopia", 1)
            `);
            supplierId = res.insertId;
            console.log(`✅ Created Supplier ID: ${supplierId}`);
        } else {
            supplierId = suppliers[0].id;
        }

        // Insert a purchase order
        const [poRes] = await pool.query(`
            INSERT INTO purchase_orders (
                po_number, 
                supplier_id, 
                order_date, 
                expected_delivery_date, 
                sector_id, 
                status_id, 
                subtotal, 
                tax_amount, 
                total_amount, 
                paid_amount, 
                created_by
            ) VALUES (
                'PO-TEST-001', 
                ?, 
                NOW(), 
                DATE_ADD(NOW(), INTERVAL 7 DAY), 
                1, 
                3, 
                2000.00, 
                0.00, 
                2000.00, 
                0.00, 
                1
            )
        `, [supplierId]);
        
        console.log(`✅ Successfully created Purchase Order ID: ${poRes.insertId} (Total: 2000 ETB)`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
