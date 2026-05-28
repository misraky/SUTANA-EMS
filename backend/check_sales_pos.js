const { db } = require('./src/config/database');
async function chk() {
  try {
    const sales = await db('pos_sales').select('id', 'invoice_number', 'deleted_at');
    const pos = await db('purchase_orders').select('id', 'po_number', 'deleted_at');
    console.log('Sales:', sales);
    console.log('POs:', pos);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
chk();
