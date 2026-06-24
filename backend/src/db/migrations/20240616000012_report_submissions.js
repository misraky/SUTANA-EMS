exports.up = async function (knex) {
  const dbName = knex.client.database();

  const tableExists = async (table) => {
    const row = await knex('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  if (!(await tableExists('report_submissions'))) {
    await knex.schema.createTable('report_submissions', (t) => {
      t.increments('id');
      t.enum('report_type', ['income_statement', 'balance_sheet', 'bank_reconciliation']).notNullable();
      t.string('period', 7).notNullable();
      t.string('financial_year', 9);
      t.string('title', 200);
      t.text('notes');
      t.integer('submitted_by').notNullable();
      t.enum('status', ['draft', 'submitted', 'ceo_approved', 'board_approved', 'rejected']).defaultTo('draft');
      t.text('ceo_comment');
      t.text('board_comment');
      t.integer('rejected_by');
      t.text('rejection_reason');
      t.integer('ceo_actioned_by');
      t.integer('board_actioned_by');
      t.timestamp('ceo_actioned_at').nullable();
      t.timestamp('board_actioned_at').nullable();
      t.timestamp('rejected_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('submitted_by').references('users.id').onDelete('CASCADE');
      t.foreign('ceo_actioned_by').references('users.id').onDelete('SET NULL');
      t.foreign('board_actioned_by').references('users.id').onDelete('SET NULL');
      t.foreign('rejected_by').references('users.id').onDelete('SET NULL');
    });
  }
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('report_submissions');
  if (exists) await knex.schema.dropTableIfExists('report_submissions');
};
