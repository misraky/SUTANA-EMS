exports.up = function(knex) {
  return knex.schema.createTable('bank_payments', table => {
    table.increments('id').primary();
    table.string('payment_id').notNullable().unique();
    table.string('reference').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('customer_name').nullable();
    table.string('customer_phone').nullable();
    table.string('bank_code').notNullable();
    table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
    table.text('description').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bank_payments');
};
