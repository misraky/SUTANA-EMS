const { db } = require('./src/config/database');
async function chk() {
  try {
    const p2 = await db.raw('SHOW COLUMNS FROM purchase_orders');
    const s2 = await db.raw('SHOW COLUMNS FROM pos_sales');
    console.log('POs:', p2[0].map(c => c.Field));
    console.log('Sales:', s2[0].map(c => c.Field));
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
chk();
