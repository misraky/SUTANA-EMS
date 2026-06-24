require('dotenv').config();
const { db } = require('./src/config/database');

async function createTable() {
  try {
    const exists = await db.schema.hasTable('supplier_catalog');
    if (!exists) {
      await db.schema.createTable('supplier_catalog', table => {
        table.increments('id').primary();
        table.integer('supplier_id').notNullable();
        table.string('product_name').notNullable();
        table.decimal('awarded_unit_price', 15, 2).notNullable();
        table.string('currency').defaultTo('ETB');
        table.date('effective_date').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('supplier_catalog table created successfully!');
    } else {
      console.log('supplier_catalog table already exists.');
    }
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit();
  }
}

createTable();
