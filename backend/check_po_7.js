const { db } = require('./src/config/database');
async function chk() {
  try {
    const po = await db.raw('SELECT id, total_amount, paid_amount FROM purchase_orders WHERE id=7');
    console.log('PO 7:', po[0][0]);
    const payments = await db.raw('SELECT * FROM po_payments WHERE po_id=7');
    console.log('Payments:', payments[0]);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
chk();
