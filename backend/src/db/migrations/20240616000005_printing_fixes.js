exports.up = function (knex) {
  return knex.schema
    .table('printing_orders', (t) => {
      t.string('payment_status', 20).defaultTo('pending');
      t.string('payment_method', 50);
    })
    .createTable('printing_product_types', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.string('code', 50).notNullable().unique();
      t.decimal('base_price_per_page', 10, 2).defaultTo(0.50);
      t.decimal('color_multiplier', 5, 2).defaultTo(2.00);
      t.boolean('is_active').defaultTo(true);
      t.integer('sort_order').defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .then(() => {
      return knex('printing_product_types').insert([
        { name: 'Book', code: 'Book', base_price_per_page: 0.50, color_multiplier: 2.00, sort_order: 1 },
        { name: 'Module', code: 'Module', base_price_per_page: 0.60, color_multiplier: 2.00, sort_order: 2 },
        { name: 'Exam', code: 'Exam', base_price_per_page: 0.75, color_multiplier: 2.50, sort_order: 3 },
        { name: 'Brochure', code: 'Brochure', base_price_per_page: 0.40, color_multiplier: 1.50, sort_order: 4 },
        { name: 'Tax Receipt', code: 'TaxReceipt', base_price_per_page: 0.30, color_multiplier: 1.00, sort_order: 5 }
      ]);
    });
};

exports.down = function (knex) {
  return knex.schema
    .table('printing_orders', (t) => {
      t.dropColumn('payment_status');
      t.dropColumn('payment_method');
    })
    .dropTableIfExists('printing_product_types');
};
