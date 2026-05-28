const { db } = require('./src/config/database');
async function chk() {
  try {
    const categories = await db('expense_categories');
    console.log('Categories:', categories);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
chk();
