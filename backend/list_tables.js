const { db } = require('./src/config/database');
async function chk() {
  try {
    const tables = await db.raw('SHOW TABLES');
    console.log(tables[0]);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
chk();
