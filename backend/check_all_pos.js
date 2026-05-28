const { db } = require('./src/config/database');
async function chk() {
  try {
    const pos = await db.raw('SELECT id, total_amount, paid_amount FROM purchase_orders');
    console.log(pos[0]);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
chk();
