exports.up = async function (knex) {
  const hasContracts = await knex.schema.hasTable('contracts');
  if (hasContracts) return;
  await knex.schema
    .createTable('contracts', (t) => {
      t.increments('id');
      t.string('contract_number', 50).notNullable().unique();
      t.string('title', 255).notNullable();
      t.integer('supplier_id').notNullable();
      t.enu('type', ['quantity', 'value', 'service', 'framework']).notNullable().defaultTo('quantity');
      t.decimal('total_value', 15, 2).notNullable().defaultTo(0);
      t.decimal('consumed_value', 15, 2).notNullable().defaultTo(0);
      t.date('start_date').notNullable();
      t.date('expiry_date').notNullable();
      t.enu('status', ['draft', 'active', 'full', 'expired', 'cancelled']).notNullable().defaultTo('draft');
      t.text('notes');
      t.integer('created_by');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.timestamp('deleted_at').nullable();
      t.foreign('supplier_id').references('suppliers.id').onDelete('CASCADE');
    })
    .createTable('contract_items', (t) => {
      t.increments('id');
      t.integer('contract_id').unsigned().notNullable();
      t.integer('product_id').unsigned();
      t.string('product_name', 255).notNullable();
      t.decimal('price', 15, 2).notNullable().defaultTo(0);
      t.decimal('quantity_committed', 15, 2).notNullable().defaultTo(0);
      t.decimal('quantity_consumed', 15, 2).notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.foreign('contract_id').references('contracts.id').onDelete('CASCADE');
    })
    .createTable('fraud_rules', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.text('description');
      t.enu('severity', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.json('config');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('fraud_alerts', (t) => {
      t.increments('id');
      t.integer('rule_id');
      t.string('rule_name', 100).notNullable();
      t.integer('supplier_id');
      t.string('supplier_name', 255);
      t.integer('po_id');
      t.decimal('amount', 15, 2).defaultTo(0);
      t.enu('risk_level', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium');
      t.text('description');
      t.enu('status', ['new', 'in_review', 'investigating', 'resolved', 'ignored', 'overridden']).notNullable().defaultTo('new');
      t.integer('resolved_by');
      t.timestamp('resolved_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.foreign('rule_id').references('fraud_rules.id').onDelete('SET NULL');
      t.foreign('po_id').references('purchase_orders.id').onDelete('SET NULL');
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('fraud_alerts')
    .dropTableIfExists('fraud_rules')
    .dropTableIfExists('contract_items')
    .dropTableIfExists('contracts');
};
