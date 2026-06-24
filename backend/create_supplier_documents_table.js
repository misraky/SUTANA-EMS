require('dotenv').config();
const { db } = require('./src/config/database');

async function createTable() {
  try {
    const exists = await db.schema.hasTable('supplier_documents');
    if (!exists) {
      await db.schema.createTable('supplier_documents', table => {
        table.increments('id').primary();
        table.integer('supplier_id').notNullable();
        table.string('document_name').notNullable();
        table.string('document_type').notNullable();
        table.string('file_url').notNullable();
        table.timestamp('uploaded_at').defaultTo(db.fn.now());
      });
      console.log('supplier_documents table created successfully!');
    } else {
      console.log('supplier_documents table already exists.');
    }
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit();
  }
}

createTable();
