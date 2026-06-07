const { db } = require('./src/config/database');

async function cleanDatabase() {
  console.log('Starting database cleanup for demo...');
  
  try {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');
    
    const tablesToClean = [
      'audit_logs',
      'pos_sale_items',
      'pos_sales',
      'payments',
      'po_items',
      'purchase_orders',
      'inventory_movements',
      'stock_adjustments',
      'inventory_counts',
      'inventory',
      'products',
      'product_categories',
      'units',
      'suppliers',
      'customers',
      'printing_jobs',
      'printing_orders',
      'expenses',
      'expense_categories',
      'tax_receipts'
    ];

    for (const table of tablesToClean) {
      try {
        await db(table).truncate();
        console.log(`✅ Emptied table: ${table}`);
      } catch (err) {
        console.log(`⚠️ Skipped ${table}: ${err.message.split(' - ')[1] || err.message}`);
      }
    }

    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🎉 Database cleaned successfully! Ready for seeding.');

  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

cleanDatabase();
