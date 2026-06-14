const { db, closeConnection } = require('../config/database');

async function migrateGallery() {
  try {
    console.log('Starting Gallery Management migration...');

    const hasTable = await db.schema.hasTable('gallery_images');
    if (!hasTable) {
      await db.schema.createTable('gallery_images', (table) => {
        table.increments('id').primary();
        table.string('category').notNullable(); // cars, workplace, events, products
        table.string('title').notNullable();
        table.text('description');
        table.string('image_path').notNullable();
        table.string('thumbnail_path');
        table.date('date_taken');
        table.string('location');
        table.integer('display_order').notNullable().defaultTo(0);
        table.string('status').notNullable().defaultTo('active'); // active, hidden
        table.integer('uploaded_by');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created gallery_images table');
    } else {
      console.log('ℹ️ gallery_images already exists');
    }

    console.log('🎉 Gallery Management migration completed!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await closeConnection();
  }
}

migrateGallery();
