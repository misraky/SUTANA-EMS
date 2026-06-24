exports.up = function (knex) {
  return knex.schema
    .createTable('admin_tiers', (t) => {
      t.increments('id');
      t.integer('user_id').unsigned().unique();
      t.enu('tier', ['L1', 'L2', 'L3', 'L4']).notNullable();
      t.timestamp('assigned_at').defaultTo(knex.fn.now());
    })
    .createTable('admin_elevations', (t) => {
      t.increments('id');
      t.integer('user_id').unsigned();
      t.string('target_tier', 10);
      t.integer('duration_minutes');
      t.text('reason');
      t.string('ticket_ref');
      t.string('status', 20).defaultTo('pending');
      t.integer('approved_by').unsigned();
      t.timestamp('approved_at').nullable();
      t.timestamp('revoked_at').nullable();
      t.timestamp('expires_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('break_glass_events', (t) => {
      t.increments('id');
      t.integer('activated_by').unsigned();
      t.text('reason');
      t.integer('co_approver_id').unsigned();
      t.timestamp('activated_at').defaultTo(knex.fn.now());
      t.timestamp('deactivated_at').nullable();
      t.integer('deactivated_by').unsigned();
      t.timestamp('expires_at').nullable();
    })
    .createTable('sod_rules', (t) => {
      t.increments('id');
      t.string('function_a');
      t.string('function_b');
      t.enu('severity', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
      t.text('description');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('sod_violations', (t) => {
      t.increments('id');
      t.integer('user_id').unsigned();
      t.integer('role_a_id').unsigned();
      t.integer('role_b_id').unsigned();
      t.integer('sod_rule_id').unsigned();
      t.string('status', 20).defaultTo('open');
      t.text('notes');
      t.timestamp('detected_at').defaultTo(knex.fn.now());
      t.timestamp('remediated_at').nullable();
    })
    .createTable('access_certifications', (t) => {
      t.increments('id');
      t.string('type', 50);
      t.string('status', 20).defaultTo('in_progress');
      t.integer('owner_id').unsigned();
      t.date('due_date');
      t.timestamp('completed_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('certification_reviews', (t) => {
      t.increments('id');
      t.integer('certification_id').unsigned();
      t.integer('user_id').unsigned();
      t.string('action', 20);
      t.text('notes');
      t.timestamp('reviewed_at').defaultTo(knex.fn.now());
    })
    .createTable('session_anomalies', (t) => {
      t.increments('id');
      t.string('session_id');
      t.string('anomaly_type', 50);
      t.text('description');
      t.string('severity', 20);
      t.timestamp('detected_at').defaultTo(knex.fn.now());
    })
    .createTable('single_roles', (t) => {
      t.increments('id');
      t.string('name').notNullable().unique();
      t.string('module');
      t.string('function');
      t.string('scope');
      t.json('permissions');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('composite_roles', (t) => {
      t.increments('id');
      t.string('name').notNullable().unique();
      t.text('description');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('composite_role_mappings', (t) => {
      t.increments('id');
      t.integer('composite_role_id').unsigned();
      t.integer('single_role_id').unsigned();
    })
    .createTable('service_accounts', (t) => {
      t.increments('id');
      t.string('name').notNullable();
      t.string('type', 50);
      t.string('scope');
      t.integer('owner_id').unsigned();
      t.string('secret_hash');
      t.date('expiration_date');
      t.string('ip_whitelist');
      t.string('status', 20).defaultTo('active');
      t.timestamp('last_used').nullable();
      t.timestamp('rotated_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('field_security', (t) => {
      t.increments('id');
      t.string('module');
      t.string('field_name');
      t.string('sensitivity', 10).defaultTo('L0');
      t.string('mask_rule');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('admin_data_scopes', (t) => {
      t.increments('id');
      t.integer('admin_id').unsigned().unique();
      t.string('geographic');
      t.string('department');
      t.string('sensitivity_limit', 10);
      t.string('time_restriction');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('delegated_nodes', (t) => {
      t.increments('id');
      t.string('name').notNullable();
      t.integer('parent_id').unsigned();
      t.enu('type', ['global', 'region', 'department']);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('delegated_assignments', (t) => {
      t.increments('id');
      t.integer('node_id').unsigned();
      t.integer('admin_id').unsigned();
      t.string('capability', 20);
      t.timestamp('assigned_at').defaultTo(knex.fn.now());
    })
    .createTable('tenants', (t) => {
      t.increments('id');
      t.string('name').notNullable();
      t.enu('isolation', ['logical', 'schema', 'database', 'instance']);
      t.string('status', 20).defaultTo('active');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('compliance_evidence', (t) => {
      t.increments('id');
      t.string('type');
      t.string('status', 20).defaultTo('ready');
      t.date('period_start');
      t.date('period_end');
      t.string('file_path');
      t.timestamp('generated_at').defaultTo(knex.fn.now());
    })
    .createTable('vendor_access', (t) => {
      t.increments('id');
      t.string('vendor_name');
      t.string('contact_name');
      t.string('contact_email');
      t.text('scope');
      t.date('start_date');
      t.date('end_date');
      t.integer('supervising_admin_id').unsigned();
      t.text('justification');
      t.string('status', 20).defaultTo('active');
      t.timestamp('extended_at').nullable();
      t.timestamp('revoked_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('dr_tests', (t) => {
      t.increments('id');
      t.string('status', 20).defaultTo('in_progress');
      t.text('notes');
      t.timestamp('completed_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    })
    .createTable('api_keys', (t) => {
      t.increments('id');
      t.string('name').notNullable();
      t.text('description');
      t.json('scopes');
      t.string('key_hash');
      t.string('ip_restriction');
      t.date('expiration_date');
      t.integer('rate_limit');
      t.boolean('is_active').defaultTo(true);
      t.timestamp('last_used').nullable();
      t.timestamp('revoked_at').nullable();
      t.timestamp('rotated_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').nullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('api_keys')
    .dropTableIfExists('dr_tests')
    .dropTableIfExists('vendor_access')
    .dropTableIfExists('compliance_evidence')
    .dropTableIfExists('tenants')
    .dropTableIfExists('delegated_assignments')
    .dropTableIfExists('delegated_nodes')
    .dropTableIfExists('admin_data_scopes')
    .dropTableIfExists('field_security')
    .dropTableIfExists('service_accounts')
    .dropTableIfExists('composite_role_mappings')
    .dropTableIfExists('composite_roles')
    .dropTableIfExists('single_roles')
    .dropTableIfExists('session_anomalies')
    .dropTableIfExists('certification_reviews')
    .dropTableIfExists('access_certifications')
    .dropTableIfExists('sod_violations')
    .dropTableIfExists('sod_rules')
    .dropTableIfExists('break_glass_events')
    .dropTableIfExists('admin_elevations')
    .dropTableIfExists('admin_tiers');
};