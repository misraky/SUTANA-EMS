const { db } = require('./src/config/database');
async function chk() {
  try {
    const p = await db.raw('SELECT * FROM po_payments');
    console.log(p[0]);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
chk();
