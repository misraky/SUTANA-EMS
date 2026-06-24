exports.up = function (knex) {
  return knex.schema
    .createTable('pos_returns', (t) => {
      t.increments('id');
      t.string('return_number', 50).notNullable().unique();
      t.integer('sale_id').unsigned().notNullable();
      t.integer('customer_id').unsigned();
      t.decimal('total_refund', 15, 2).notNullable().defaultTo(0);
      t.string('refund_method', 20).defaultTo('original');
      t.text('reason');
      t.integer('processed_by').unsigned().notNullable();
      t.string('status', 20).defaultTo('completed');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('pos_return_items', (t) => {
      t.increments('id');
      t.integer('return_id').unsigned().notNullable();
      t.integer('product_id').unsigned().notNullable();
      t.integer('quantity').notNullable();
      t.decimal('unit_price', 15, 2).notNullable();
      t.decimal('refund_amount', 15, 2).notNullable();
      t.string('reason_code', 50).defaultTo('customer_return');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.foreign('return_id').references('pos_returns.id').onDelete('CASCADE');
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('pos_return_items')
    .dropTableIfExists('pos_returns');
};
