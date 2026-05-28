const { db } = require('./src/config/database');
async function checkSchema() {
  try {
    const res = await db.raw('DESCRIBE po_items');
    console.log(res[0]);
    
    // Also let's check inventory table
    const inv = await db.raw('DESCRIBE inventory');
    console.log('\nInventory Table:');
    console.log(inv[0]);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkSchema();
