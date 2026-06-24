exports.up = async function (knex) {
  const hasStatus = await knex.schema.hasTable('crisis_status');
  if (!hasStatus) {
    await knex.schema.createTable('crisis_status', (t) => {
      t.increments('id');
      t.boolean('is_active').defaultTo(false);
      t.timestamp('activated_at').nullable();
      t.string('activated_by', 100);
      t.timestamp('deactivated_at').nullable();
      t.text('reason');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasActions = await knex.schema.hasTable('crisis_actions');
  if (!hasActions) {
    await knex.schema.createTable('crisis_actions', (t) => {
      t.increments('id');
      t.string('title', 200).notNullable();
      t.text('description');
      t.enu('priority', ['critical', 'high', 'medium', 'low']).defaultTo('high');
      t.enu('status', ['pending', 'in-progress', 'completed']).defaultTo('pending');
      t.string('assigned_to', 100);
      t.date('deadline');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasFastTrack = await knex.schema.hasTable('crisis_fast_track');
  if (!hasFastTrack) {
    await knex.schema.createTable('crisis_fast_track', (t) => {
      t.increments('id');
      t.string('request_title', 200).notNullable();
      t.text('description');
      t.decimal('amount', 14, 2);
      t.string('requested_by', 100);
      t.enu('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
      t.string('approved_by', 100);
      t.timestamp('approved_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const count = await knex('crisis_status').count('id as c').first();
  if (parseInt(count.c) === 0) {
    await knex('crisis_status').insert([
      { is_active: false, reason: 'Normal operations' }
    ]);

    await knex('crisis_actions').insert([
      { title: 'Activate Business Continuity Plan', description: 'Notify all department heads and activate BCP protocols', priority: 'critical', status: 'pending', assigned_to: 'CEO', deadline: '2025-12-31' },
      { title: 'Communicate with Stakeholders', description: 'Draft and send crisis communication to key stakeholders, clients, and partners', priority: 'critical', status: 'pending', assigned_to: 'Communications Lead', deadline: '2025-12-31' },
      { title: 'Secure Critical Infrastructure', description: 'Ensure all critical systems, data backups, and facilities are secured', priority: 'high', status: 'pending', assigned_to: 'IT Director', deadline: '2025-12-31' },
      { title: 'Establish Emergency Command Center', description: 'Set up physical/virtual command center for crisis coordination', priority: 'high', status: 'pending', assigned_to: 'Operations Manager', deadline: '2025-12-31' },
    ]);

    await knex('crisis_fast_track').insert([
      { request_title: 'Emergency IT Infrastructure Upgrade', description: 'Immediate server capacity expansion to handle remote work surge', amount: 2500000, requested_by: 'Sarah Akinyi', status: 'approved', approved_by: 'CEO', approved_at: '2025-06-01' },
      { request_title: 'Urgent Supplier Payment Release', description: 'Release emergency payment to alternative paper supplier to secure 4-week stock', amount: 1800000, requested_by: 'Joseph Kiprop', status: 'pending' },
    ]);
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('crisis_fast_track');
  await knex.schema.dropTableIfExists('crisis_actions');
  await knex.schema.dropTableIfExists('crisis_status');
};
