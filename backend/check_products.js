const { db } = require('./src/config/database');
async function chk() {
  try {
    const res = await db.raw('DESCRIBE products');
    console.log(res[0]);
  } catch (e) {
    console.log(e.message);
  }
  process.exit(0);
}
chk();
