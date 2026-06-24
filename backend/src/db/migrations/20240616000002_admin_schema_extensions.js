exports.up = function (knex) {
  return knex.schema
    .alterTable('users', (t) => {
      t.string('admin_tier', 10);
      t.timestamp('last_password_change').nullable();
      t.boolean('password_change_required').defaultTo(false);
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('users', (t) => {
      t.dropColumn('admin_tier');
      t.dropColumn('last_password_change');
      t.dropColumn('password_change_required');
    });
};