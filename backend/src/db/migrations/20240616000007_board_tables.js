exports.up = async function (knex) {
  const hasMeetings = await knex.schema.hasTable('board_meetings');
  if (!hasMeetings) {
    await knex.schema.createTable('board_meetings', (t) => {
      t.increments('id');
      t.string('title', 200).notNullable();
      t.date('meeting_date').notNullable();
      t.time('meeting_time');
      t.string('venue', 200);
      t.enu('status', ['scheduled', 'in-progress', 'completed', 'cancelled']).defaultTo('scheduled');
      t.text('agenda');
      t.text('minutes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasPacks = await knex.schema.hasTable('board_packs');
  if (!hasPacks) {
    await knex.schema.createTable('board_packs', (t) => {
      t.increments('id');
      t.integer('meeting_id').unsigned().references('id').inTable('board_meetings').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.string('document_type', 100);
      t.string('file_url', 500);
      t.enu('status', ['draft', 'final', 'distributed']).defaultTo('draft');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasShareholders = await knex.schema.hasTable('shareholders');
  if (!hasShareholders) {
    await knex.schema.createTable('shareholders', (t) => {
      t.increments('id');
      t.string('name', 200).notNullable();
      t.string('email', 150);
      t.string('phone', 20);
      t.decimal('share_percentage', 5, 2).defaultTo(0);
      t.integer('shares_count').defaultTo(0);
      t.enu('share_type', ['ordinary', 'preferred', 'founder']).defaultTo('ordinary');
      t.enu('status', ['active', 'inactive']).defaultTo('active');
      t.date('joined_date');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasDividends = await knex.schema.hasTable('dividends');
  if (!hasDividends) {
    await knex.schema.createTable('dividends', (t) => {
      t.increments('id');
      t.integer('shareholder_id').unsigned().references('id').inTable('shareholders').onDelete('CASCADE');
      t.string('period', 50).notNullable();
      t.decimal('total_amount', 14, 2).notNullable();
      t.decimal('per_share', 10, 2);
      t.date('declaration_date');
      t.date('payment_date');
      t.enu('status', ['declared', 'paid', 'cancelled']).defaultTo('declared');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasResolutions = await knex.schema.hasTable('board_resolutions');
  if (!hasResolutions) {
    await knex.schema.createTable('board_resolutions', (t) => {
      t.increments('id');
      t.string('title', 200).notNullable();
      t.text('description');
      t.integer('meeting_id').unsigned().references('id').inTable('board_meetings').onDelete('SET NULL');
      t.date('resolution_date');
      t.enu('status', ['proposed', 'passed', 'rejected', 'implemented']).defaultTo('proposed');
      t.string('proposed_by', 100);
      t.text('outcome');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const count = await knex('board_meetings').count('id as c').first();
  if (parseInt(count.c) === 0) {
    await knex('board_meetings').insert([
      { title: 'Q1 2025 Board Strategy Session', meeting_date: '2025-01-20', meeting_time: '09:00:00', venue: 'Executive Boardroom', status: 'completed', agenda: 'Review Q4 results, approve annual budget, discuss expansion strategy' },
      { title: 'Q2 2025 Board Meeting', meeting_date: '2025-04-15', meeting_time: '10:00:00', venue: 'Executive Boardroom', status: 'completed', agenda: 'Q1 performance review, dividend declaration, new project approvals' },
      { title: 'Emergency Board Session', meeting_date: '2025-06-10', meeting_time: '14:00:00', venue: 'Virtual (Zoom)', status: 'completed', agenda: 'Address supply chain disruption and risk mitigation strategies' },
      { title: 'Q3 2025 Board Meeting', meeting_date: '2025-07-21', meeting_time: '09:30:00', venue: 'Executive Boardroom', status: 'scheduled', agenda: 'Half-year financial review, strategic pivot discussion, leadership succession update' },
      { title: 'Annual General Meeting 2025', meeting_date: '2025-09-15', meeting_time: '10:00:00', venue: 'Main Conference Hall', status: 'scheduled', agenda: 'Annual report presentation, director elections, dividend vote, shareholder Q&A' },
    ]);

    await knex('board_packs').insert([
      { meeting_id: 1, title: 'Q1 Strategy Pack', document_type: 'Board Pack', status: 'distributed' },
      { meeting_id: 1, title: 'Financial Review Q4 2024', document_type: 'Financial Report', status: 'distributed' },
      { meeting_id: 1, title: 'Annual Budget Proposal 2025', document_type: 'Budget', status: 'distributed' },
      { meeting_id: 2, title: 'Q1 2025 Performance Report', document_type: 'Performance Report', status: 'distributed' },
      { meeting_id: 2, title: 'Dividend Declaration Proposal', document_type: 'Dividend Proposal', status: 'distributed' },
      { meeting_id: 3, title: 'Supply Chain Risk Assessment', document_type: 'Risk Report', status: 'distributed' },
      { meeting_id: 4, title: 'Half-Year Financial Statements', document_type: 'Financial Report', status: 'final' },
      { meeting_id: 4, title: 'Succession Planning Update', document_type: 'HR Report', status: 'final' },
      { meeting_id: 5, title: 'Annual Report 2024-2025', document_type: 'Annual Report', status: 'draft' },
      { meeting_id: 5, title: 'Director Nominee Biographies', document_type: 'Governance', status: 'draft' },
    ]);

    await knex('shareholders').insert([
      { name: 'Habtamu Abera', email: 'ceo@sutana.com', share_percentage: 35.00, shares_count: 35000, share_type: 'founder', status: 'active', joined_date: '2018-01-01' },
      { name: 'Kidist Belay', email: 'admin@sutana.com', share_percentage: 25.00, shares_count: 25000, share_type: 'founder', status: 'active', joined_date: '2018-01-01' },
      { name: 'Melat Sisay', email: 'finance@sutana.com', share_percentage: 15.00, shares_count: 15000, share_type: 'ordinary', status: 'active', joined_date: '2019-03-15' },
      { name: 'Zemen Equity Partners', email: 'investor@zemenep.com', share_percentage: 15.00, shares_count: 15000, share_type: 'preferred', status: 'active', joined_date: '2020-06-01' },
      { name: 'Tigist Hailu', email: 'tigist.h@example.com', share_percentage: 5.00, shares_count: 5000, share_type: 'ordinary', status: 'active', joined_date: '2020-09-20' },
      { name: 'Biruk Assefa', email: 'biruk.a@example.com', share_percentage: 3.00, shares_count: 3000, share_type: 'ordinary', status: 'active', joined_date: '2021-01-10' },
      { name: 'Meron Tesfaye', email: 'meron.t@example.com', share_percentage: 2.00, shares_count: 2000, share_type: 'ordinary', status: 'inactive', joined_date: '2021-05-15' },
    ]);

    await knex('dividends').insert([
      { shareholder_id: 1, period: '2024-Q4', total_amount: 1750000, per_share: 50, declaration_date: '2025-01-15', payment_date: '2025-01-30', status: 'paid' },
      { shareholder_id: 2, period: '2024-Q4', total_amount: 1250000, per_share: 50, declaration_date: '2025-01-15', payment_date: '2025-01-30', status: 'paid' },
      { shareholder_id: 3, period: '2024-Q4', total_amount: 750000, per_share: 50, declaration_date: '2025-01-15', payment_date: '2025-01-30', status: 'paid' },
      { shareholder_id: 4, period: '2024-Q4', total_amount: 750000, per_share: 50, declaration_date: '2025-01-15', payment_date: '2025-01-30', status: 'paid' },
      { shareholder_id: 5, period: '2024-Q4', total_amount: 250000, per_share: 50, declaration_date: '2025-01-15', payment_date: '2025-01-30', status: 'paid' },
      { shareholder_id: 6, period: '2024-Q4', total_amount: 150000, per_share: 50, declaration_date: '2025-01-15', payment_date: '2025-01-30', status: 'paid' },
      { shareholder_id: 1, period: '2025-Q1', total_amount: 2100000, per_share: 60, declaration_date: '2025-04-10', payment_date: '2025-04-25', status: 'paid' },
      { shareholder_id: 2, period: '2025-Q1', total_amount: 1500000, per_share: 60, declaration_date: '2025-04-10', payment_date: '2025-04-25', status: 'paid' },
      { shareholder_id: 3, period: '2025-Q1', total_amount: 900000, per_share: 60, declaration_date: '2025-04-10', payment_date: '2025-04-25', status: 'paid' },
      { shareholder_id: 4, period: '2025-Q1', total_amount: 900000, per_share: 60, declaration_date: '2025-04-10', payment_date: '2025-04-25', status: 'paid' },
      { shareholder_id: 5, period: '2025-Q1', total_amount: 300000, per_share: 60, declaration_date: '2025-04-10', payment_date: '2025-04-25', status: 'paid' },
      { shareholder_id: 6, period: '2025-Q1', total_amount: 180000, per_share: 60, declaration_date: '2025-04-10', payment_date: '2025-04-25', status: 'paid' },
      { shareholder_id: 1, period: '2025-Q2', total_amount: 2450000, per_share: 70, declaration_date: '2025-07-10', payment_date: null, status: 'declared' },
      { shareholder_id: 2, period: '2025-Q2', total_amount: 1750000, per_share: 70, declaration_date: '2025-07-10', payment_date: null, status: 'declared' },
      { shareholder_id: 3, period: '2025-Q2', total_amount: 1050000, per_share: 70, declaration_date: '2025-07-10', payment_date: null, status: 'declared' },
      { shareholder_id: 4, period: '2025-Q2', total_amount: 1050000, per_share: 70, declaration_date: '2025-07-10', payment_date: null, status: 'declared' },
      { shareholder_id: 5, period: '2025-Q2', total_amount: 350000, per_share: 70, declaration_date: '2025-07-10', payment_date: null, status: 'declared' },
      { shareholder_id: 6, period: '2025-Q2', total_amount: 210000, per_share: 70, declaration_date: '2025-07-10', payment_date: null, status: 'declared' },
    ]);

    await knex('board_resolutions').insert([
      { title: 'Approval of FY2025 Annual Budget', meeting_id: 1, resolution_date: '2025-01-20', status: 'passed', proposed_by: 'CFO', outcome: 'Budget approved with amendments to marketing allocation' },
      { title: 'Dividend Declaration Q4 2024', meeting_id: 1, resolution_date: '2025-01-20', status: 'implemented', proposed_by: 'Board Chair', outcome: 'Dividend of 50 ETB per share declared and paid' },
      { title: 'New Printing Equipment Acquisition', meeting_id: 2, resolution_date: '2025-04-15', status: 'implemented', proposed_by: 'Production Director', outcome: 'Approved capital expenditure of 2.5M ETB for new Heidelberg press' },
      { title: 'Supply Chain Emergency Measures', meeting_id: 3, resolution_date: '2025-06-10', status: 'passed', proposed_by: 'CEO', outcome: 'Emergency procurement protocols activated, alternative suppliers onboarded' },
      { title: 'Leadership Succession Framework', meeting_id: 2, resolution_date: '2025-04-15', status: 'passed', proposed_by: 'HR Director', outcome: 'Succession planning policy adopted for all C-suite positions' },
      { title: 'Pharmacy Division Expansion', meeting_id: 4, resolution_date: null, status: 'proposed', proposed_by: 'CEO', outcome: null },
      { title: 'ESG Reporting Mandate', meeting_id: 4, resolution_date: null, status: 'proposed', proposed_by: 'Board Chair', outcome: null },
      { title: 'Share Buyback Program', meeting_id: 5, resolution_date: null, status: 'proposed', proposed_by: 'CFO', outcome: null },
    ]);
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('board_resolutions');
  await knex.schema.dropTableIfExists('dividends');
  await knex.schema.dropTableIfExists('shareholders');
  await knex.schema.dropTableIfExists('board_packs');
  await knex.schema.dropTableIfExists('board_meetings');
};
