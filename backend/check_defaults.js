const { db } = require('./src/config/database');
async function chk() {
  try {
    const categories = await db.raw('SELECT * FROM product_categories LIMIT 1');
    console.log('Category:', categories[0][0]);
    const units = await db.raw('SELECT * FROM product_units LIMIT 1');
    console.log('Unit:', units[0][0]);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
chk();
