const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sutana_ems'
}).promise();

async function run() {
    try {
        console.log('Seeding mock payment history to populate the tables...');
        
        // 1. Clear existing payments to prevent duplicate keys or clutter
        await pool.query('DELETE FROM invoice_payments');
        await pool.query('DELETE FROM po_payments');

        // 2. Ensure customer and credit sale exist
        let [customers] = await pool.query('SELECT id FROM customers LIMIT 1');
        let customerId;
        if (customers.length === 0) {
            const [res] = await pool.query('INSERT INTO customers (name, phone, current_balance) VALUES ("Test Customer", "0911223344", 1000)');
            customerId = res.insertId;
        } else {
            customerId = customers[0].id;
        }

        let [sales] = await pool.query('SELECT id FROM pos_sales WHERE id = 1');
        if (sales.length === 0) {
            await pool.query(`
                INSERT INTO pos_sales (
                    id, customer_id, cashier_id, total_amount, subtotal, tax_amount, 
                    amount_paid, payment_method_id, invoice_number, status_id, sale_date
                ) VALUES (
                    1, ?, 1, 1000.00, 1000.00, 0.00, 300.00, 2, 'INV-TEST-001', 1, NOW()
                )
            `, [customerId]);
            console.log('✅ Ensured Sale ID: 1 exists.');
        } else {
            await pool.query('UPDATE pos_sales SET amount_paid = 300.00 WHERE id = 1');
        }

        // 3. Ensure supplier and PO exist
        let [suppliers] = await pool.query('SELECT id FROM suppliers LIMIT 1');
        let supplierId;
        if (suppliers.length === 0) {
            const [res] = await pool.query(`
                INSERT INTO suppliers (name, contact_person, phone, email, address, is_active) 
                VALUES ("Test Supplier Ltd.", "Supplier Contact", "0912111111", "supplier@test.com", "Addis Ababa, Ethiopia", 1)
            `);
            supplierId = res.insertId;
        } else {
            supplierId = suppliers[0].id;
        }

        let [pos] = await pool.query('SELECT id FROM purchase_orders WHERE id = 1');
        if (pos.length === 0) {
            await pool.query(`
                INSERT INTO purchase_orders (
                    id, po_number, supplier_id, order_date, expected_delivery_date, 
                    sector_id, status_id, subtotal, tax_amount, total_amount, paid_amount, created_by
                ) VALUES (
                    1, 'PO-TEST-001', ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 3, 2000.00, 0.00, 2000.00, 500.00, 1
                )
            `, [supplierId]);
            console.log('✅ Ensured Purchase Order ID: 1 exists.');
        } else {
            await pool.query('UPDATE purchase_orders SET paid_amount = 500.00 WHERE id = 1');
        }

        // 4. Insert mock invoice payment (Inbound)
        await pool.query(`
            INSERT INTO invoice_payments (
                sale_id, amount, payment_method_id, reference_number, status_id, processed_by, processed_at, notes
            ) VALUES (
                1, 300.00, 3, 'TXN-INV-999', 2, 1, NOW(), 'Mock Inbound Payment'
            )
        `);
        console.log('✅ Seeded mock invoice payment.');

        // 5. Insert mock PO payment (Outbound)
        await pool.query(`
            INSERT INTO po_payments (
                po_id, amount, payment_method_id, reference_number, status_id, processed_by, processed_at, notes
            ) VALUES (
                1, 500.00, 3, 'TXN-PO-888', 2, 1, NOW(), 'Mock Outbound Payment'
            )
        `);
        console.log('✅ Seeded mock PO payment.');

        console.log('🎉 Successfully populated payments history data! Table will now show up.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
