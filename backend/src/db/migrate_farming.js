const { db, closeConnection } = require('../config/database');

async function migrateFarmingTables() {
  try {
    console.log('Starting Farming module migration...');

    // 1. farming_categories
    const hasCategories = await db.schema.hasTable('farming_categories');
    if (!hasCategories) {
      await db.schema.createTable('farming_categories', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('slug').notNullable().unique();
        table.text('description');
        table.string('cover_image');
        table.string('icon_class');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created farming_categories table');
    } else {
      console.log('ℹ️ farming_categories table already exists');
    }

    // 2. farming_products
    const hasProducts = await db.schema.hasTable('farming_products');
    if (!hasProducts) {
      await db.schema.createTable('farming_products', (table) => {
        table.increments('id').primary();
        table.integer('category_id').unsigned().references('id').inTable('farming_categories').onDelete('SET NULL');
        table.string('name').notNullable();
        table.text('description');
        table.text('usage_instructions');
        table.decimal('price', 10, 2).notNullable();
        table.integer('stock_quantity').defaultTo(0);
        table.integer('reorder_level').defaultTo(10);
        table.string('product_image');
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created farming_products table');
    } else {
      console.log('ℹ️ farming_products table already exists');
    }

    // 3. farming_orders
    const hasOrders = await db.schema.hasTable('farming_orders');
    if (!hasOrders) {
      await db.schema.createTable('farming_orders', (table) => {
        table.increments('id').primary();
        table.integer('customer_id').nullable().references('id').inTable('users').onDelete('SET NULL');
        table.string('invoice_number').unique().notNullable();
        table.decimal('total_amount', 12, 2).notNullable();
        table.enum('payment_method', ['cash', 'telebirr', 'bank_transfer', 'awaiting']).defaultTo('awaiting');
        table.enum('status', ['PROCESSING', 'AWAITING_PAYMENT', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED']).defaultTo('PROCESSING');
        table.enum('delivery_type', ['pickup', 'delivery']).defaultTo('pickup');
        table.string('delivery_address');
        table.decimal('delivery_fee', 10, 2).defaultTo(0);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created farming_orders table');
    } else {
      console.log('ℹ️ farming_orders table already exists');
    }

    // 4. farming_order_items
    const hasOrderItems = await db.schema.hasTable('farming_order_items');
    if (!hasOrderItems) {
      await db.schema.createTable('farming_order_items', (table) => {
        table.increments('id').primary();
        table.integer('order_id').unsigned().references('id').inTable('farming_orders').onDelete('CASCADE');
        table.integer('product_id').unsigned().references('id').inTable('farming_products').onDelete('RESTRICT');
        table.integer('quantity').notNullable();
        table.decimal('unit_price', 10, 2).notNullable();
        table.decimal('subtotal', 12, 2).notNullable();
      });
      console.log('✅ Created farming_order_items table');
    } else {
      console.log('ℹ️ farming_order_items table already exists');
    }

    // 5. farming_finance_reports
    const hasFinanceReports = await db.schema.hasTable('farming_finance_reports');
    if (!hasFinanceReports) {
      await db.schema.createTable('farming_finance_reports', (table) => {
        table.increments('id').primary();
        table.integer('farming_worker_id').references('id').inTable('users');
        table.integer('finance_officer_id').nullable().references('id').inTable('users');
        table.date('report_date').notNullable();
        table.decimal('total_system_sales', 12, 2).notNullable();
        table.decimal('cash_collected', 12, 2).defaultTo(0);
        table.decimal('telebirr_collected', 12, 2).defaultTo(0);
        table.decimal('transfer_collected', 12, 2).defaultTo(0);
        table.decimal('physical_cash_counted', 12, 2).notNullable();
        table.decimal('difference_amount', 12, 2).defaultTo(0);
        table.string('difference_reason');
        table.decimal('refunds_given', 12, 2).defaultTo(0);
        table.decimal('expenses_transport', 12, 2).defaultTo(0);
        table.decimal('expenses_loading', 12, 2).defaultTo(0);
        table.text('notes');
        table.enum('status', ['SUBMITTED', 'APPROVED']).defaultTo('SUBMITTED');
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created farming_finance_reports table');
    } else {
      console.log('ℹ️ farming_finance_reports table already exists');
    }

    // 6. farming_reorder_requests
    const hasReorderRequests = await db.schema.hasTable('farming_reorder_requests');
    if (!hasReorderRequests) {
      await db.schema.createTable('farming_reorder_requests', (table) => {
        table.increments('id').primary();
        table.integer('product_id').unsigned().references('id').inTable('farming_products').onDelete('CASCADE');
        table.integer('requested_by').references('id').inTable('users');
        table.integer('approved_by').nullable().references('id').inTable('users');
        table.integer('quantity_requested').notNullable();
        table.string('status').defaultTo('PENDING'); // PENDING, APPROVED, REJECTED, ORDERED
        table.text('notes');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created farming_reorder_requests table');
    } else {
      console.log('ℹ️ farming_reorder_requests table already exists');
    }

    // 7. farming_shifts
    const hasShifts = await db.schema.hasTable('farming_shifts');
    if (!hasShifts) {
      await db.schema.createTable('farming_shifts', (table) => {
        table.increments('id').primary();
        table.integer('worker_id').unsigned().nullable();
        table.integer('manager_id').unsigned().nullable();
        table.enum('shift_type', ['morning', 'afternoon']).defaultTo('morning');
        table.decimal('opening_float', 12, 2).defaultTo(0);
        table.decimal('total_sales', 12, 2).defaultTo(0);
        table.integer('transaction_count').defaultTo(0);
        table.decimal('cash_collected', 12, 2).defaultTo(0);
        table.decimal('telebirr_collected', 12, 2).defaultTo(0);
        table.decimal('transfer_collected', 12, 2).defaultTo(0);
        table.decimal('physical_cash_counted', 12, 2).nullable();
        table.decimal('difference_amount', 12, 2).defaultTo(0);
        table.string('difference_reason');
        table.enum('status', ['OPEN', 'CLOSED', 'VERIFIED']).defaultTo('OPEN');
        table.text('manager_notes');
        table.text('finance_notes');
        table.timestamp('opened_at').defaultTo(db.fn.now());
        table.timestamp('closed_at').nullable();
        table.timestamp('verified_at').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created farming_shifts table');
    } else {
      console.log('ℹ️ farming_shifts table already exists');
    }

    // 8. Add type column to farming_categories (if not exists)
    const hasTypeCol = await db.schema.hasColumn('farming_categories', 'type');
    if (!hasTypeCol) {
      await db.schema.alterTable('farming_categories', (table) => {
        table.string('type').defaultTo('general');
      });
      console.log('✅ Added type column to farming_categories');
    } else {
      console.log('ℹ️ type column already exists on farming_categories');
    }

    console.log('🎉 Farming module migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await closeConnection();
  }
}

migrateFarmingTables();
