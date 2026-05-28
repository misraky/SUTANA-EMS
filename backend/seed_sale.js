const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
}).promise();

async function run() {
    try {
        console.log('Inserting a dummy credit sale into pos_sales...');
        
        // Ensure a customer exists
        let [customers] = await pool.query('SELECT id FROM customers LIMIT 1');
        let customerId;
        if (customers.length === 0) {
            const [res] = await pool.query('INSERT INTO customers (name, phone, current_balance) VALUES ("Test Customer", "0911223344", 1000)');
            customerId = res.insertId;
        } else {
            customerId = customers[0].id;
        }

        // Insert a sale with payment_method_id = 2 (Credit)
        const [saleRes] = await pool.query(`
            INSERT INTO pos_sales (
                customer_id, 
                cashier_id,
                total_amount, 
                subtotal,
                tax_amount,
                amount_paid, 
                payment_method_id, 
                invoice_number, 
                status_id, 
                sale_date
            ) VALUES (
                ?, 
                1,
                1000.00, 
                1000.00,
                0.00,
                0.00, 
                2, 
                'INV-TEST-001', 
                1, 
                NOW()
            )
        `, [customerId]);
        
        // Update customer balance
        await pool.query('UPDATE customers SET current_balance = current_balance + 1000 WHERE id = ?', [customerId]);

        console.log(`✅ Successfully created Sale ID: ${saleRes.insertId} (Credit Sale for 1000 ETB)`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
