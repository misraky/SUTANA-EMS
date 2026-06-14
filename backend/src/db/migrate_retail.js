const { db, closeConnection } = require('../config/database');

async function migrateRetailTables() {
  try {
    console.log('Starting Retail Store module migration...');

    const hasCategories = await db.schema.hasTable('retail_categories');
    if (!hasCategories) {
      await db.schema.createTable('retail_categories', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('slug').notNullable().unique();
        table.text('description');
        table.string('icon_class');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      await db('retail_categories').insert([
        { name: 'Stationery', slug: 'stationery', description: 'Pens, notebooks, paper products' },
        { name: 'Office Supplies', slug: 'office-supplies', description: 'Printers, toners, office equipment' },
        { name: 'Electronics', slug: 'electronics', description: 'Gadgets, accessories, cables' },
        { name: 'Furniture', slug: 'furniture', description: 'Desks, chairs, storage' },
      ]);
      console.log('✅ Created retail_categories table + seed data');
    } else {
      console.log('ℹ️ retail_categories already exists');
    }

    const hasProducts = await db.schema.hasTable('retail_products');
    if (!hasProducts) {
      await db.schema.createTable('retail_products', (table) => {
        table.increments('id').primary();
        table.integer('category_id').unsigned().references('id').inTable('retail_categories').onDelete('SET NULL');
        table.string('sku').notNullable().unique();
        table.string('name').notNullable();
        table.text('description');
        table.decimal('price', 10, 2).notNullable();
        table.decimal('cost_price', 10, 2).defaultTo(0);
        table.integer('stock_quantity').defaultTo(0);
        table.integer('reorder_level').defaultTo(10);
        table.string('product_image');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created retail_products table');
    } else {
      console.log('ℹ️ retail_products already exists');
    }

    const hasOrders = await db.schema.hasTable('retail_orders');
    if (!hasOrders) {
      await db.schema.createTable('retail_orders', (table) => {
        table.increments('id').primary();
        table.integer('customer_id').nullable();
        table.string('invoice_number').unique().notNullable();
        table.decimal('subtotal', 12, 2).defaultTo(0);
        table.decimal('tax', 12, 2).defaultTo(0);
        table.decimal('delivery_fee', 10, 2).defaultTo(0);
        table.decimal('total_amount', 12, 2).notNullable();
        table.enum('status', ['PROCESSING', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).defaultTo('PROCESSING');
        table.enum('payment_status', ['AWAITING_PAYMENT', 'PAID', 'OVERDUE']).defaultTo('AWAITING_PAYMENT');
        table.enum('payment_method', ['cash', 'bank_transfer', 'telebirr', 'credit']).defaultTo('cash');
        table.enum('delivery_type', ['pickup', 'delivery']).defaultTo('pickup');
        table.string('delivery_address');
        table.text('notes');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created retail_orders table');
    } else {
      console.log('ℹ️ retail_orders already exists');
    }

    const hasOrderItems = await db.schema.hasTable('retail_order_items');
    if (!hasOrderItems) {
      await db.schema.createTable('retail_order_items', (table) => {
        table.increments('id').primary();
        table.integer('order_id').unsigned().references('id').inTable('retail_orders').onDelete('CASCADE');
        table.integer('product_id').unsigned().references('id').inTable('retail_products').onDelete('RESTRICT');
        table.integer('quantity').notNullable();
        table.decimal('unit_price', 10, 2).notNullable();
        table.decimal('subtotal', 12, 2).notNullable();
      });
      console.log('✅ Created retail_order_items table');
    } else {
      console.log('ℹ️ retail_order_items already exists');
    }

    const hasCart = await db.schema.hasTable('retail_cart_items');
    if (!hasCart) {
      await db.schema.createTable('retail_cart_items', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('product_id').unsigned().references('id').inTable('retail_products').onDelete('CASCADE');
        table.integer('quantity').notNullable().defaultTo(1);
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created retail_cart_items table');
    } else {
      console.log('ℹ️ retail_cart_items already exists');
    }

    const hasShifts = await db.schema.hasTable('retail_shifts');
    if (!hasShifts) {
      await db.schema.createTable('retail_shifts', (table) => {
        table.increments('id').primary();
        table.integer('cashier_id').unsigned().nullable();
        table.enum('shift_type', ['morning', 'afternoon', 'evening']).defaultTo('morning');
        table.decimal('opening_float', 12, 2).defaultTo(0);
        table.decimal('total_sales', 12, 2).defaultTo(0);
        table.integer('transaction_count').defaultTo(0);
        table.decimal('cash_collected', 12, 2).defaultTo(0);
        table.decimal('telebirr_collected', 12, 2).defaultTo(0);
        table.decimal('transfer_collected', 12, 2).defaultTo(0);
        table.decimal('credit_collected', 12, 2).defaultTo(0);
        table.decimal('physical_cash_counted', 12, 2).nullable();
        table.decimal('difference_amount', 12, 2).defaultTo(0);
        table.string('difference_reason');
        table.enum('status', ['OPEN', 'CLOSED', 'VERIFIED']).defaultTo('OPEN');
        table.timestamp('opened_at').defaultTo(db.fn.now());
        table.timestamp('closed_at').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created retail_shifts table');
    } else {
      console.log('ℹ️ retail_shifts already exists');
    }

    const hasTransactions = await db.schema.hasTable('retail_transactions');
    if (!hasTransactions) {
      await db.schema.createTable('retail_transactions', (table) => {
        table.increments('id').primary();
        table.integer('shift_id').unsigned().references('id').inTable('retail_shifts').onDelete('SET NULL');
        table.string('invoice_number').unique().notNullable();
        table.decimal('total_amount', 12, 2).notNullable();
        table.enum('payment_method', ['cash', 'bank_transfer', 'telebirr', 'credit']).notNullable();
        table.string('payment_ref');
        table.decimal('discount_percent', 5, 2).defaultTo(0);
        table.decimal('discount_amount', 12, 2).defaultTo(0);
        table.string('customer_phone');
        table.text('notes');
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created retail_transactions table');
    } else {
      console.log('ℹ️ retail_transactions already exists');
    }

    console.log('🎉 Retail Store module migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await closeConnection();
  }
}

migrateRetailTables();
