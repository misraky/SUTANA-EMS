exports.up = async function (knex) {
  const hasRisk = await knex.schema.hasTable('risk_register');
  if (!hasRisk) {
    await knex.schema.createTable('risk_register', (t) => {
      t.increments('id');
      t.string('title', 200).notNullable();
      t.text('description');
      t.string('category', 100);
      t.enu('likelihood', ['rare', 'unlikely', 'possible', 'likely', 'almost-certain']).defaultTo('possible');
      t.enu('impact', ['negligible', 'minor', 'moderate', 'major', 'severe']).defaultTo('moderate');
      t.integer('risk_score');
      t.enu('status', ['identified', 'assessed', 'mitigated', 'monitored', 'closed']).defaultTo('identified');
      t.string('owner', 100);
      t.text('mitigation_strategy');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasCompliance = await knex.schema.hasTable('compliance_status');
  if (!hasCompliance) {
    await knex.schema.createTable('compliance_status', (t) => {
      t.increments('id');
      t.string('requirement', 200).notNullable();
      t.string('regulation', 100);
      t.enu('status', ['compliant', 'non-compliant', 'in-progress', 'not-applicable']).defaultTo('in-progress');
      t.date('last_review_date');
      t.date('next_review_date');
      t.string('responsible_owner', 100);
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasRegulatory = await knex.schema.hasTable('regulatory_calendar');
  if (!hasRegulatory) {
    await knex.schema.createTable('regulatory_calendar', (t) => {
      t.increments('id');
      t.string('title', 200).notNullable();
      t.text('description');
      t.string('authority', 100);
      t.date('deadline').notNullable();
      t.enu('status', ['upcoming', 'due-soon', 'overdue', 'completed']).defaultTo('upcoming');
      t.string('owner', 100);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasESG = await knex.schema.hasTable('esg_metrics');
  if (!hasESG) {
    await knex.schema.createTable('esg_metrics', (t) => {
      t.increments('id');
      t.string('category', 50).notNullable();
      t.string('metric_name', 200).notNullable();
      t.decimal('current_value', 12, 2);
      t.decimal('target_value', 12, 2);
      t.string('unit', 50);
      t.string('period', 50);
      t.enu('trend', ['improving', 'stable', 'declining']).defaultTo('stable');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasCyber = await knex.schema.hasTable('cybersecurity_status');
  if (!hasCyber) {
    await knex.schema.createTable('cybersecurity_status', (t) => {
      t.increments('id');
      t.string('control_name', 200).notNullable();
      t.string('category', 100);
      t.enu('status', ['implemented', 'in-progress', 'not-started', 'not-applicable']).defaultTo('not-started');
      t.date('last_assessment_date');
      t.date('next_review_date');
      t.integer('score').defaultTo(0);
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const count = await knex('risk_register').count('id as c').first();
  if (parseInt(count.c) === 0) {
    await knex('risk_register').insert([
      { title: 'Supply Chain Disruption', description: 'Dependence on single paper supplier creates production risk', category: 'Operational', likelihood: 'likely', impact: 'major', risk_score: 16, status: 'mitigated', owner: 'Joseph Kiprop', mitigation_strategy: 'Identified 3 alternative suppliers, maintain 4-week buffer stock' },
      { title: 'IT System Downtime', description: 'Server failure or network outage could halt all digital operations', category: 'Technology', likelihood: 'possible', impact: 'severe', risk_score: 15, status: 'monitored', owner: 'Sarah Akinyi', mitigation_strategy: 'UPS backup, daily cloud backups, failover server ready' },
      { title: 'Currency Fluctuation', description: 'ETB depreciation increases cost of imported printing materials', category: 'Financial', likelihood: 'likely', impact: 'moderate', risk_score: 12, status: 'monitored', owner: 'Robert Kiplagat', mitigation_strategy: 'Forward contracts, maintain 3-month FX reserve' },
      { title: 'Regulatory Non-Compliance', description: 'Changes in tax or labor laws could result in penalties', category: 'Compliance', likelihood: 'unlikely', impact: 'major', risk_score: 10, status: 'assessed', owner: 'David Ochieng', mitigation_strategy: 'Monthly regulatory monitoring, external legal audit quarterly' },
      { title: 'Data Breach', description: 'Customer payment data or internal records exposed', category: 'Cybersecurity', likelihood: 'unlikely', impact: 'severe', risk_score: 10, status: 'mitigated', owner: 'Sarah Akinyi', mitigation_strategy: 'Encryption at rest and transit, MFA enforced, quarterly penetration testing' },
      { title: 'Key Person Dependency', description: 'Critical roles (CEO, CFO, Production Manager) lack immediate backup', category: 'Human Resources', likelihood: 'possible', impact: 'major', risk_score: 12, status: 'assessed', owner: 'Mary Njoki', mitigation_strategy: 'Succession plans created for all C-suite, cross-training program initiated' },
      { title: 'Customer Concentration', description: 'Top 3 customers represent 60% of printing revenue', category: 'Strategic', likelihood: 'possible', impact: 'moderate', risk_score: 8, status: 'identified', owner: 'Michael Njoroge', mitigation_strategy: 'Sales team focused on market diversification, SME outreach program' },
      { title: 'Fire / Physical Disaster', description: 'Fire in production facility could destroy equipment and inventory', category: 'Operational', likelihood: 'rare', impact: 'severe', risk_score: 6, status: 'mitigated', owner: 'John Mutua', mitigation_strategy: 'Fire suppression system, insurance coverage, offsite data backup' },
    ]);

    await knex('compliance_status').insert([
      { requirement: 'Tax Filing - Corporate Income Tax', regulation: 'Tax Proclamation', status: 'compliant', last_review_date: '2025-03-15', next_review_date: '2025-06-30', responsible_owner: 'Robert Kiplagat', notes: 'All quarterly filings completed on time' },
      { requirement: 'VAT / Sales Tax Remittance', regulation: 'Tax Proclamation', status: 'compliant', last_review_date: '2025-04-01', next_review_date: '2025-07-01', responsible_owner: 'Jane Wangui', notes: 'Monthly remittances up to date' },
      { requirement: 'Payroll Tax & Social Security', regulation: 'Labor Proclamation', status: 'compliant', last_review_date: '2025-04-15', next_review_date: '2025-07-15', responsible_owner: 'David Ochieng', notes: 'All employee deductions remitted' },
      { requirement: 'Data Protection Compliance', regulation: 'Data Protection Proclamation', status: 'in-progress', last_review_date: '2025-02-01', next_review_date: '2025-08-01', responsible_owner: 'Sarah Akinyi', notes: 'Privacy policy updated, consent mechanisms being implemented' },
      { requirement: 'Environmental Waste Disposal', regulation: 'Environmental Protection', status: 'in-progress', last_review_date: '2025-01-20', next_review_date: '2025-07-20', responsible_owner: 'John Mutua', notes: 'Waste segregation implemented, disposal partner onboarding' },
      { requirement: 'Employment Equity Reporting', regulation: 'Labor Proclamation', status: 'non-compliant', last_review_date: '2024-12-01', next_review_date: '2025-06-01', responsible_owner: 'David Ochieng', notes: 'Annual report overdue, external consultant engaged' },
      { requirement: 'Business License Renewal', regulation: 'Trade License', status: 'compliant', last_review_date: '2025-01-05', next_review_date: '2026-01-05', responsible_owner: 'Mary Njoki', notes: 'License renewed annually, next renewal Jan 2026' },
      { requirement: 'Fire Safety Inspection', regulation: 'Fire Safety Regulations', status: 'in-progress', last_review_date: '2025-03-10', next_review_date: '2025-09-10', responsible_owner: 'John Mutua', notes: 'Inspection scheduled for next quarter' },
    ]);

    await knex('regulatory_calendar').insert([
      { title: 'Annual Corporate Tax Return Filing', description: 'Submit annual tax return to Ministry of Revenue', authority: 'Ministry of Revenue', deadline: '2025-06-30', status: 'due-soon', owner: 'Robert Kiplagat' },
      { title: 'Employment Equity Report Submission', description: 'Submit annual workforce diversity and equity report', authority: 'Ministry of Labor', deadline: '2025-06-15', status: 'overdue', owner: 'David Ochieng' },
      { title: 'Data Protection Audit', description: 'Annual data protection compliance audit', authority: 'Data Protection Authority', deadline: '2025-08-15', status: 'upcoming', owner: 'Sarah Akinyi' },
      { title: 'Environmental Compliance Report', description: 'Quarterly environmental impact assessment submission', authority: 'Environmental Protection Authority', deadline: '2025-07-20', status: 'upcoming', owner: 'John Mutua' },
      { title: 'Business License Renewal', description: 'Annual business license and trade permit renewal', authority: 'Ministry of Trade', deadline: '2026-01-05', status: 'upcoming', owner: 'Mary Njoki' },
      { title: 'VAT Quarterly Return', description: 'Quarterly VAT return filing', authority: 'Ministry of Revenue', deadline: '2025-07-10', status: 'upcoming', owner: 'Jane Wangui' },
      { title: 'Fire Safety Re-Inspection', description: 'Annual fire safety inspection by city fire department', authority: 'City Fire Department', deadline: '2025-09-10', status: 'upcoming', owner: 'John Mutua' },
      { title: 'Pension Fund Remittance Report', description: 'Monthly employee pension fund remittance report', authority: 'Pension Fund Authority', deadline: '2025-06-07', status: 'completed', owner: 'David Ochieng' },
    ]);

    await knex('esg_metrics').insert([
      { category: 'Environmental', metric_name: 'Paper Recycling Rate', current_value: 62, target_value: 80, unit: '%', period: '2025-Q2', trend: 'improving' },
      { category: 'Environmental', metric_name: 'Energy Consumption', current_value: 45200, target_value: 40000, unit: 'kWh/month', period: '2025-Q2', trend: 'declining' },
      { category: 'Environmental', metric_name: 'Water Usage', current_value: 18500, target_value: 15000, unit: 'liters/month', period: '2025-Q2', trend: 'stable' },
      { category: 'Environmental', metric_name: 'Waste Diversion Rate', current_value: 45, target_value: 60, unit: '%', period: '2025-Q2', trend: 'improving' },
      { category: 'Social', metric_name: 'Employee Training Hours', current_value: 240, target_value: 500, unit: 'hours/quarter', period: '2025-Q2', trend: 'improving' },
      { category: 'Social', metric_name: 'Gender Diversity Ratio', current_value: 45, target_value: 50, unit: '% female', period: '2025-Q2', trend: 'improving' },
      { category: 'Social', metric_name: 'Community Investment', current_value: 150000, target_value: 250000, unit: 'ETB/year', period: '2025-Q2', trend: 'stable' },
      { category: 'Social', metric_name: 'Employee Satisfaction Score', current_value: 72, target_value: 85, unit: '%', period: '2025-Q2', trend: 'improving' },
      { category: 'Governance', metric_name: 'Board Meeting Attendance', current_value: 95, target_value: 100, unit: '%', period: '2025-Q2', trend: 'stable' },
      { category: 'Governance', metric_name: 'Policy Compliance Rate', current_value: 88, target_value: 95, unit: '%', period: '2025-Q2', trend: 'improving' },
      { category: 'Governance', metric_name: 'Whistleblower Reports', current_value: 0, target_value: 0, unit: 'reports', period: '2025-Q2', trend: 'stable' },
      { category: 'Governance', metric_name: 'Audit Findings Resolved', current_value: 14, target_value: 20, unit: 'findings', period: '2025-Q2', trend: 'improving' },
    ]);

    await knex('cybersecurity_status').insert([
      { control_name: 'Multi-Factor Authentication (MFA)', category: 'Access Control', status: 'implemented', last_assessment_date: '2025-04-01', next_review_date: '2025-10-01', score: 90, notes: 'MFA enforced for all user accounts' },
      { control_name: 'Endpoint Protection', category: 'Infrastructure', status: 'implemented', last_assessment_date: '2025-03-15', next_review_date: '2025-09-15', score: 85, notes: 'AV/EDR deployed on all workstations' },
      { control_name: 'Data Encryption at Rest', category: 'Data Security', status: 'in-progress', last_assessment_date: '2025-02-20', next_review_date: '2025-08-20', score: 60, notes: 'Database encrypted, file server encryption in progress' },
      { control_name: 'Network Segmentation', category: 'Network Security', status: 'implemented', last_assessment_date: '2025-01-10', next_review_date: '2025-07-10', score: 80, notes: 'Guest network separated, VLANs configured' },
      { control_name: 'Patch Management', category: 'Infrastructure', status: 'in-progress', last_assessment_date: '2025-04-05', next_review_date: '2025-07-05', score: 65, notes: 'Automated patching for OS, manual for legacy systems' },
      { control_name: 'Incident Response Plan', category: 'Governance', status: 'implemented', last_assessment_date: '2025-03-01', next_review_date: '2025-09-01', score: 75, notes: 'IR plan documented, tabletop exercise conducted' },
      { control_name: 'Third-Party Risk Management', category: 'Governance', status: 'not-started', last_assessment_date: null, next_review_date: '2025-12-01', score: 0, notes: 'Vendor security assessments not yet implemented' },
      { control_name: 'Security Awareness Training', category: 'Governance', status: 'in-progress', last_assessment_date: '2025-04-10', next_review_date: '2025-10-10', score: 55, notes: 'Annual training completed for 60% of staff' },
      { control_name: 'Intrusion Detection System', category: 'Network Security', status: 'not-started', last_assessment_date: null, next_review_date: '2025-11-01', score: 0, notes: 'IDS/IPS solution under evaluation' },
      { control_name: 'Backup and Recovery', category: 'Infrastructure', status: 'implemented', last_assessment_date: '2025-04-15', next_review_date: '2025-10-15', score: 95, notes: 'Daily automated backups, monthly recovery test' },
    ]);
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('cybersecurity_status');
  await knex.schema.dropTableIfExists('esg_metrics');
  await knex.schema.dropTableIfExists('regulatory_calendar');
  await knex.schema.dropTableIfExists('compliance_status');
  await knex.schema.dropTableIfExists('risk_register');
};
