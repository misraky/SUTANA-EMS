exports.up = async function (knex) {
  const dbName = knex.client.database();

  const tableExists = async (table) => {
    const row = await knex('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  if (!(await tableExists('goods_receipt_notes'))) {
    await knex.schema.createTable('goods_receipt_notes', (t) => {
      t.increments('id');
      t.string('grn_number', 30).notNullable().unique();
      t.integer('po_id').notNullable();
      t.date('received_date').notNullable();
      t.integer('received_by').notNullable();
      t.string('receiving_note', 500);
      t.enum('status', ['pending', 'completed', 'partial']).defaultTo('completed');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await tableExists('grn_items'))) {
    await knex.schema.createTable('grn_items', (t) => {
      t.increments('id');
      t.integer('grn_id').notNullable();
      t.integer('po_item_id').notNullable();
      t.integer('quantity_ordered').notNullable();
      t.integer('quantity_received').notNullable();
      t.integer('quantity_damaged').defaultTo(0);
      t.boolean('quality_pass').defaultTo(true);
      t.decimal('unit_price', 15, 2).notNullable();
      t.decimal('total', 15, 2).notNullable();
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('grn_items');
  await knex.schema.dropTableIfExists('goods_receipt_notes');
};
