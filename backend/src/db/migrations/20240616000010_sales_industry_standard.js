exports.up = async function (knex) {
  // Safely add columns to customers (check if they exist)
  const custCols = await knex('information_schema.COLUMNS')
    .where({ TABLE_SCHEMA: knex.client.database(), TABLE_NAME: 'customers', COLUMN_NAME: 'customer_group' })
    .first();
  if (!custCols) {
    await knex.schema.alterTable('customers', (t) => {
      t.string('customer_group', 50).defaultTo('Retail');
      t.integer('loyalty_tier_id').unsigned();
      t.decimal('total_lifetime_value', 15, 2).defaultTo(0);
      t.date('last_purchase_date');
      t.string('preferred_communication', 20).defaultTo('SMS');
      t.text('tags');
      t.integer('total_visits').defaultTo(0);
    });
  }

  // Create tables only if they don't exist
  const tables = await knex('information_schema.TABLES')
    .where({ TABLE_SCHEMA: knex.client.database() })
    .select('TABLE_NAME');
  const existingTables = new Set(tables.map(r => r.TABLE_NAME));

  if (!existingTables.has('price_lists')) {
    await knex.schema.createTable('price_lists', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.text('description');
      t.string('currency', 3).defaultTo('ETB');
      t.boolean('is_active').defaultTo(true);
      t.date('effective_from');
      t.date('effective_to');
      t.integer('priority').defaultTo(0);
      t.integer('created_by').unsigned();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!existingTables.has('price_list_items')) {
    await knex.schema.createTable('price_list_items', (t) => {
      t.increments('id');
      t.integer('price_list_id').unsigned().notNullable();
      t.integer('product_id').notNullable(); // match products.id type (int(11) signed)
      t.decimal('unit_price', 15, 2).notNullable();
      t.integer('min_quantity').defaultTo(1);
      t.foreign('price_list_id').references('price_lists.id').onDelete('CASCADE');
      t.foreign('product_id').references('products.id').onDelete('CASCADE');
      t.unique(['price_list_id', 'product_id', 'min_quantity']);
    });
  }

  if (!existingTables.has('promotions')) {
    await knex.schema.createTable('promotions', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.text('description');
      t.enum('type', ['percentage', 'fixed', 'bogo', 'bundle', 'loyalty']).notNullable();
      t.decimal('value', 15, 2).notNullable();
      t.decimal('min_purchase_amount', 15, 2).defaultTo(0);
      t.enum('applies_to', ['all', 'category', 'product']).defaultTo('all');
      t.integer('product_id').unsigned();
      t.integer('category_id').unsigned();
      t.dateTime('start_date').notNullable();
      t.dateTime('end_date').notNullable();
      t.boolean('is_active').defaultTo(true);
      t.integer('max_uses').defaultTo(0);
      t.integer('current_uses').defaultTo(0);
      t.string('coupon_code', 50);
      t.boolean('requires_coupon').defaultTo(false);
      t.integer('created_by').unsigned();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!existingTables.has('loyalty_tiers')) {
    await knex.schema.createTable('loyalty_tiers', (t) => {
      t.increments('id');
      t.string('name', 50).notNullable().unique();
      t.decimal('min_annual_spend', 15, 2).defaultTo(0);
      t.decimal('discount_percent', 5, 2).defaultTo(0);
      t.decimal('points_multiplier', 5, 2).defaultTo(1);
      t.string('color', 7).defaultTo('#94a3b8');
      t.text('benefits');
      t.integer('sort_order').defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!existingTables.has('loyalty_points')) {
    await knex.schema.createTable('loyalty_points', (t) => {
      t.increments('id');
      t.integer('customer_id').notNullable(); // match customers.id type (int(11) signed)
      t.decimal('points', 12, 2).notNullable();
      t.enum('type', ['earned', 'redeemed', 'expired', 'reversed', 'signup_bonus']);
      t.string('reference_type', 50);
      t.integer('reference_id').unsigned();
      t.date('expires_at');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.foreign('customer_id').references('customers.id').onDelete('CASCADE');
    });
  }

  if (!existingTables.has('loyalty_rewards')) {
    await knex.schema.createTable('loyalty_rewards', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.text('description');
      t.integer('points_required').notNullable();
      t.string('reward_type', 50).defaultTo('discount');
      t.decimal('reward_value', 15, 2);
      t.boolean('is_active').defaultTo(true);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!existingTables.has('leads')) {
    await knex.schema.createTable('leads', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.string('phone', 20);
      t.string('email', 100);
      t.string('source', 50).defaultTo('walk_in');
      t.enum('status', ['new', 'contacted', 'qualified', 'converted', 'lost']).defaultTo('new');
      t.text('notes');
      t.integer('assigned_to').unsigned();
      t.integer('converted_to_customer_id'); // match customers.id type (int(11) signed)
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!existingTables.has('opportunities')) {
    await knex.schema.createTable('opportunities', (t) => {
      t.increments('id');
      t.integer('lead_id').unsigned();
      t.integer('customer_id'); // match customers.id type (int(11) signed)
      t.string('name', 200).notNullable();
      t.text('description');
      t.enum('stage', ['new', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']);
      t.decimal('expected_value', 15, 2).defaultTo(0);
      t.decimal('probability', 5, 2).defaultTo(0);
      t.date('expected_close_date');
      t.integer('assigned_to').unsigned();
      t.text('notes');
      t.string('lost_reason', 200);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('lead_id').references('leads.id').onDelete('SET NULL');
    });
  }

  if (!existingTables.has('quotations')) {
    await knex.schema.createTable('quotations', (t) => {
      t.increments('id');
      t.string('quote_number', 50).notNullable().unique();
      t.integer('customer_id'); // match customers.id type (int(11) signed)
      t.integer('opportunity_id').unsigned();
      t.decimal('subtotal', 15, 2).defaultTo(0);
      t.decimal('tax_amount', 15, 2).defaultTo(0);
      t.decimal('total_amount', 15, 2).defaultTo(0);
      t.enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired']).defaultTo('draft');
      t.date('valid_until');
      t.text('terms_conditions');
      t.text('notes');
      t.integer('created_by').unsigned();
      t.integer('approved_by').unsigned();
      t.timestamp('approved_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!existingTables.has('quotation_items')) {
    await knex.schema.createTable('quotation_items', (t) => {
      t.increments('id');
      t.integer('quotation_id').unsigned().notNullable();
      t.integer('product_id'); // match products.id type (int(11) signed)
      t.string('product_name', 200).notNullable();
      t.decimal('quantity', 15, 2).notNullable();
      t.decimal('unit_price', 15, 2).notNullable();
      t.decimal('discount_percent', 5, 2).defaultTo(0);
      t.decimal('line_total', 15, 2).notNullable();
      t.foreign('quotation_id').references('quotations.id').onDelete('CASCADE');
    });
  }

  if (!existingTables.has('rma_returns')) {
    await knex.schema.createTable('rma_returns', (t) => {
      t.increments('id');
      t.string('return_number', 50).notNullable().unique();
      t.integer('original_sale_id').notNullable(); // match pos_sales.id type (int(11) signed)
      t.integer('customer_id'); // match customers.id type (int(11) signed)
      t.enum('condition', ['unopened', 'opened', 'damaged', 'defective']).defaultTo('unopened');
      t.decimal('restocking_fee', 15, 2).defaultTo(0);
      t.enum('refund_method', ['original', 'cash', 'store_credit', 'bank_transfer']).defaultTo('original');
      t.decimal('total_refund', 15, 2).defaultTo(0);
      t.enum('status', ['pending_review', 'approved', 'rejected', 'completed']).defaultTo('pending_review');
      t.text('reason');
      t.integer('processed_by').unsigned();
      t.integer('approved_by').unsigned();
      t.text('inspection_notes');
      t.text('rejection_reason');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('original_sale_id').references('pos_sales.id');
    });
  }

  if (!existingTables.has('rma_return_items')) {
    await knex.schema.createTable('rma_return_items', (t) => {
      t.increments('id');
      t.integer('rma_return_id').unsigned().notNullable();
      t.integer('product_id').notNullable(); // match products.id type (int(11) signed)
      t.decimal('quantity', 15, 2).notNullable();
      t.enum('item_condition', ['unopened', 'opened', 'damaged', 'defective']);
      t.decimal('refund_amount', 15, 2).notNullable();
      t.string('reason_code', 50).defaultTo('customer_return');
      t.foreign('rma_return_id').references('rma_returns.id').onDelete('CASCADE');
    });
  }

  if (!existingTables.has('sales_targets')) {
    await knex.schema.createTable('sales_targets', (t) => {
      t.increments('id');
      t.integer('user_id').unsigned();
      t.integer('business_unit_id').unsigned();
      t.date('target_date').notNullable();
      t.enum('period', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).notNullable();
      t.decimal('target_amount', 15, 2).notNullable();
      t.decimal('achieved_amount', 15, 2).defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Fix existing price_list_items FK if needed
  const hasPriceListFk = await knex('information_schema.TABLE_CONSTRAINTS')
    .where({ CONSTRAINT_SCHEMA: knex.client.database(), TABLE_NAME: 'price_list_items', CONSTRAINT_TYPE: 'FOREIGN KEY', CONSTRAINT_NAME: 'price_list_items_product_id_foreign' })
    .first();
  if (!hasPriceListFk && existingTables.has('price_list_items')) {
    try {
      await knex.schema.alterTable('price_list_items', (t) => {
        t.foreign('product_id').references('products.id').onDelete('CASCADE');
      });
    } catch (e) {
      console.warn('Could not add FK on price_list_items.product_id:', e.message);
    }
  }
};

exports.down = async function (knex) {
  const tables = ['sales_targets', 'rma_return_items', 'rma_returns', 'quotation_items',
    'quotations', 'opportunities', 'leads', 'loyalty_points', 'loyalty_rewards', 'loyalty_tiers',
    'promotions', 'price_list_items', 'price_lists'];
  for (const t of tables) {
    const exists = await knex.schema.hasTable(t);
    if (exists) await knex.schema.dropTableIfExists(t);
  }
  const custCols = await knex('information_schema.COLUMNS')
    .where({ TABLE_SCHEMA: knex.client.database(), TABLE_NAME: 'customers', COLUMN_NAME: 'customer_group' })
    .first();
  if (custCols) {
    await knex.schema.alterTable('customers', (t) => {
      t.dropColumn('total_visits');
      t.dropColumn('tags');
      t.dropColumn('preferred_communication');
      t.dropColumn('last_purchase_date');
      t.dropColumn('total_lifetime_value');
      t.dropColumn('loyalty_tier_id');
      t.dropColumn('customer_group');
    });
  }
};
