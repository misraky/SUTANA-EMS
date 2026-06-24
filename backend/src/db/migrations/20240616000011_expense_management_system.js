exports.up = async function (knex) {
  const dbName = knex.client.database();

  // Helper: check if a column exists
  const colExists = async (table, col) => {
    const row = await knex('information_schema.COLUMNS')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table, COLUMN_NAME: col })
      .first();
    return !!row;
  };

  // Helper: check if a table exists
  const tableExists = async (table) => {
    const row = await knex('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  // Helper: add column only if missing
  const addCol = async (table, cb) => {
    // We can't easily introspect; just wrap in try/catch
    try {
      await knex.schema.alterTable(table, cb);
    } catch (e) {
      if (e.message.includes('Duplicate column name')) {
        // Already exists, skip
      } else {
        throw e;
      }
    }
  };

  // 1. Expenses - add columns if missing
  await addCol('expenses', (t) => {
    t.string('approval_tier', 20).defaultTo(null);
    t.string('payment_status', 30).defaultTo('unpaid');
    t.integer('budget_id').unsigned();
    t.decimal('encumbered_amount', 15, 2).defaultTo(0);
    t.string('currency', 3).defaultTo('ETB');
    t.decimal('exchange_rate', 15, 6).defaultTo(1);
    t.decimal('tax_amount', 15, 2).defaultTo(0);
    t.decimal('withholding_tax', 15, 2).defaultTo(0);
    t.decimal('vat_amount', 15, 2).defaultTo(0);
    t.decimal('net_amount', 15, 2).defaultTo(0);
    t.integer('payment_processor_id').unsigned();
    t.timestamp('payment_processed_at').nullable();
    t.string('payment_reference', 100);
    t.integer('po_id').unsigned();
    t.integer('grn_id').unsigned();
    t.integer('coa_id').unsigned();
    t.boolean('is_encumbered').defaultTo(false);
    t.timestamp('encumbered_at').nullable();
    t.timestamp('de_encumbered_at').nullable();
    t.string('erca_declaration_ref', 50);
    t.boolean('tax_declared').defaultTo(false);
  });

  // 2. Chart of Accounts
  if (!(await tableExists('chart_of_accounts'))) {
    await knex.schema.createTable('chart_of_accounts', (t) => {
      t.increments('id');
      t.string('account_code', 20).notNullable().unique();
      t.string('account_name', 200).notNullable();
      t.enum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense']).notNullable();
      t.string('account_class', 50);
      t.integer('parent_id').unsigned();
      t.boolean('is_active').defaultTo(true);
      t.boolean('is_control_account').defaultTo(false);
      t.text('description');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('parent_id').references('chart_of_accounts.id').onDelete('SET NULL');
    });
  }

  // 3. Budget Periods
  if (!(await tableExists('budget_periods'))) {
    await knex.schema.createTable('budget_periods', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.enum('period_type', ['monthly', 'quarterly', 'yearly', 'custom']).notNullable();
      t.date('start_date').notNullable();
      t.date('end_date').notNullable();
      t.decimal('total_budget', 15, 2).defaultTo(0);
      t.decimal('total_encumbered', 15, 2).defaultTo(0);
      t.decimal('total_spent', 15, 2).defaultTo(0);
      t.enum('status', ['draft', 'active', 'frozen', 'closed']).defaultTo('draft');
      t.integer('created_by').unsigned();
      t.integer('approved_by').unsigned();
      t.timestamp('approved_at').nullable();
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 4. Budget Items
  if (!(await tableExists('budget_items'))) {
    await knex.schema.createTable('budget_items', (t) => {
      t.increments('id');
      t.integer('budget_period_id').unsigned().notNullable();
      t.integer('category_id'); // match expense_categories.id type
      t.integer('coa_id').unsigned();
      t.decimal('allocated_amount', 15, 2).notNullable();
      t.decimal('encumbered_amount', 15, 2).defaultTo(0);
      t.decimal('spent_amount', 15, 2).defaultTo(0);
      t.decimal('remaining_amount', 15, 2).defaultTo(0);
      t.text('notes');
      t.foreign('budget_period_id').references('budget_periods.id').onDelete('CASCADE');
      t.foreign('category_id').references('expense_categories.id').onDelete('SET NULL');
      t.foreign('coa_id').references('chart_of_accounts.id').onDelete('SET NULL');
    });
  }

  // 5. Budget Encumbrances
  if (!(await tableExists('budget_encumbrances'))) {
    await knex.schema.createTable('budget_encumbrances', (t) => {
      t.increments('id');
      t.integer('budget_item_id').unsigned().notNullable();
      t.integer('expense_id'); // match expenses.id type
      t.integer('purchase_order_id').unsigned();
      t.decimal('amount', 15, 2).notNullable();
      t.enum('status', ['encumbered', 'disbursed', 'released', 'cancelled']).defaultTo('encumbered');
      t.timestamp('encumbered_at').defaultTo(knex.fn.now());
      t.timestamp('disbursed_at').nullable();
      t.timestamp('released_at').nullable();
      t.integer('created_by').unsigned();
      t.text('notes');
      t.foreign('budget_item_id').references('budget_items.id').onDelete('CASCADE');
      t.foreign('expense_id').references('expenses.id').onDelete('SET NULL');
    });
  }

  // 6. Expense Approvers
  if (!(await tableExists('expense_approvers'))) {
    await knex.schema.createTable('expense_approvers', (t) => {
      t.increments('id');
      t.integer('user_id').notNullable(); // match users.id type
      t.enum('approval_tier', ['manager', 'director', 'ceo']).notNullable();
      t.decimal('min_amount', 15, 2).defaultTo(0);
      t.decimal('max_amount', 15, 2).defaultTo(999999999.99);
      t.boolean('is_active').defaultTo(true);
      t.integer('priority').defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.foreign('user_id').references('users.id').onDelete('CASCADE');
    });
  }

  // 7. Expense Approval Requests
  if (!(await tableExists('expense_approval_requests'))) {
    await knex.schema.createTable('expense_approval_requests', (t) => {
      t.increments('id');
      t.integer('expense_id').notNullable(); // match expenses.id type
      t.integer('approver_id'); // match users.id type
      t.enum('tier', ['manager', 'director', 'ceo']).notNullable();
      t.enum('status', ['pending', 'approved', 'rejected', 'escalated', 'skipped']).defaultTo('pending');
      t.text('comments');
      t.timestamp('actioned_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('expense_id').references('expenses.id').onDelete('CASCADE');
      t.foreign('approver_id').references('users.id').onDelete('SET NULL');
    });
  }

  // 8. Petty Cash Funds
  if (!(await tableExists('petty_cash_funds'))) {
    await knex.schema.createTable('petty_cash_funds', (t) => {
      t.increments('id');
      t.string('fund_name', 100).notNullable();
      t.decimal('imprest_amount', 15, 2).notNullable();
      t.decimal('current_balance', 15, 2).notNullable();
      t.decimal('max_disbursement', 15, 2).defaultTo(5000);
      t.decimal('max_per_transaction', 15, 2).defaultTo(2000);
      t.integer('custodian_id').notNullable(); // match users.id type
      t.enum('status', ['active', 'suspended', 'closed']).defaultTo('active');
      t.timestamp('last_reconciled_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('custodian_id').references('users.id').onDelete('CASCADE');
    });
  }

  // 9. Petty Cash Transactions
  if (!(await tableExists('petty_cash_transactions'))) {
    await knex.schema.createTable('petty_cash_transactions', (t) => {
      t.increments('id');
      t.integer('fund_id').unsigned().notNullable();
      t.enum('type', ['disbursement', 'replenishment', 'adjustment', 'transfer']).notNullable();
      t.decimal('amount', 15, 2).notNullable();
      t.integer('category_id'); // match expense_categories.id type
      t.text('description').notNullable();
      t.string('receipt_path', 255);
      t.integer('requested_by').unsigned();
      t.integer('approved_by').unsigned();
      t.enum('status', ['pending', 'approved', 'rejected', 'paid']).defaultTo('pending');
      t.timestamp('paid_at').nullable();
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('fund_id').references('petty_cash_funds.id').onDelete('CASCADE');
      t.foreign('category_id').references('expense_categories.id').onDelete('SET NULL');
    });
  }

  // 10. Supplier Credit Limits
  if (!(await tableExists('supplier_credit_limits'))) {
    await knex.schema.createTable('supplier_credit_limits', (t) => {
      t.increments('id');
      t.integer('supplier_id').notNullable(); // match suppliers.id type
      t.decimal('credit_limit', 15, 2).notNullable();
      t.decimal('current_utilization', 15, 2).defaultTo(0);
      t.string('currency', 3).defaultTo('ETB');
      t.integer('payment_terms_days').defaultTo(30);
      t.decimal('interest_rate', 5, 2).defaultTo(0);
      t.date('review_date');
      t.enum('status', ['active', 'suspended', 'closed']).defaultTo('active');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('supplier_id').references('suppliers.id').onDelete('CASCADE');
    });
  }

  // 11. Three Way Matches
  if (!(await tableExists('three_way_matches'))) {
    await knex.schema.createTable('three_way_matches', (t) => {
      t.increments('id');
      t.integer('expense_id'); // match expenses.id type
      t.integer('po_id').notNullable(); // match purchase_orders.id type
      t.integer('grn_id').unsigned();
      t.enum('match_status', ['pending', 'matched', 'mismatch', 'partial']).defaultTo('pending');
      t.decimal('po_amount', 15, 2);
      t.decimal('grn_amount', 15, 2);
      t.decimal('invoice_amount', 15, 2);
      t.decimal('variance_amount', 15, 2);
      t.text('variance_reason');
      t.integer('matched_by').unsigned();
      t.timestamp('matched_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.foreign('expense_id').references('expenses.id').onDelete('SET NULL');
      t.foreign('po_id').references('purchase_orders.id').onDelete('CASCADE');
    });
  }

  // 12. Payment Schedules
  if (!(await tableExists('payment_schedules'))) {
    await knex.schema.createTable('payment_schedules', (t) => {
      t.increments('id');
      t.string('reference_type', 30).notNullable();
      t.integer('reference_id').unsigned().notNullable();
      t.decimal('total_amount', 15, 2).notNullable();
      t.decimal('paid_amount', 15, 2).defaultTo(0);
      t.decimal('remaining_amount', 15, 2).notNullable();
      t.date('due_date').notNullable();
      t.date('scheduled_date');
      t.enum('status', ['pending', 'partial', 'paid', 'overdue', 'cancelled']).defaultTo('pending');
      t.integer('supplier_id').unsigned();
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 13. Month End Closes
  if (!(await tableExists('month_end_closes'))) {
    await knex.schema.createTable('month_end_closes', (t) => {
      t.increments('id');
      t.string('close_period', 7).notNullable();
      t.date('close_date').notNullable();
      t.enum('status', ['open', 'closing', 'closed', 'reopened']).defaultTo('open');
      t.timestamp('closed_at').nullable();
      t.integer('closed_by').unsigned();
      t.integer('reopened_by').unsigned();
      t.timestamp('reopened_at').nullable();
      t.text('checklist_results');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['close_period']);
    });
  }

  // 14. Tax Registrations
  if (!(await tableExists('tax_registrations'))) {
    await knex.schema.createTable('tax_registrations', (t) => {
      t.increments('id');
      t.string('tax_type', 30).notNullable();
      t.string('registration_number', 50).notNullable();
      t.date('registration_date');
      t.date('expiry_date');
      t.decimal('rate', 5, 2).notNullable();
      t.boolean('is_active').defaultTo(true);
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 15. Expense Taxes
  if (!(await tableExists('expense_taxes'))) {
    await knex.schema.createTable('expense_taxes', (t) => {
      t.increments('id');
      t.integer('expense_id').notNullable(); // match expenses.id type
      t.string('tax_type', 30).notNullable();
      t.decimal('taxable_amount', 15, 2).notNullable();
      t.decimal('tax_rate', 5, 2).notNullable();
      t.decimal('tax_amount', 15, 2).notNullable();
      t.string('erca_reference', 50);
      t.boolean('declared').defaultTo(false);
      t.timestamp('declared_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.foreign('expense_id').references('expenses.id').onDelete('CASCADE');
    });
  }

  // 16. Expense Audit Trail
  if (!(await tableExists('expense_audit_trail'))) {
    await knex.schema.createTable('expense_audit_trail', (t) => {
      t.increments('id');
      t.integer('expense_id').notNullable(); // match expenses.id type
      t.string('action', 50).notNullable();
      t.integer('actor_id'); // match users.id type
      t.string('actor_name', 100);
      t.text('old_values');
      t.text('new_values');
      t.string('ip_address', 45);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.foreign('expense_id').references('expenses.id').onDelete('CASCADE');
    });
  }
};

exports.down = async function (knex) {
  const tables = [
    'expense_audit_trail', 'expense_taxes', 'tax_registrations',
    'month_end_closes', 'payment_schedules', 'three_way_matches',
    'supplier_credit_limits', 'petty_cash_transactions', 'petty_cash_funds',
    'expense_approval_requests', 'expense_approvers', 'budget_encumbrances',
    'budget_items', 'budget_periods', 'chart_of_accounts'
  ];
  for (const t of tables) {
    const exists = await knex.schema.hasTable(t);
    if (exists) await knex.schema.dropTableIfExists(t);
  }
  // Drop columns from expenses (try each, skip if missing)
  const expenseCols = [
    'approval_tier', 'payment_status', 'budget_id', 'encumbered_amount',
    'currency', 'exchange_rate', 'tax_amount', 'withholding_tax',
    'vat_amount', 'net_amount', 'payment_processor_id', 'payment_processed_at',
    'payment_reference', 'po_id', 'grn_id', 'coa_id', 'is_encumbered',
    'encumbered_at', 'de_encumbered_at', 'erca_declaration_ref', 'tax_declared'
  ];
  for (const col of expenseCols) {
    const exists = await knex('information_schema.COLUMNS')
      .where({ TABLE_SCHEMA: knex.client.database(), TABLE_NAME: 'expenses', COLUMN_NAME: col })
      .first();
    if (exists) {
      try {
        await knex.schema.alterTable('expenses', (t) => t.dropColumn(col));
      } catch (e) {
        // ignore
      }
    }
  }
};
