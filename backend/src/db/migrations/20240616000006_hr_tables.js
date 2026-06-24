exports.up = async function (knex) {
  const hasSalary = await knex.schema.hasColumn('employees', 'salary');
  if (!hasSalary) {
    await knex.schema.table('employees', (t) => {
      t.decimal('salary', 12, 2);
      t.enu('gender', ['Male', 'Female', 'Other']);
      t.date('date_of_birth');
      t.string('phone', 20);
      t.text('address');
      t.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    });
  }

  const hasAttendance = await knex.schema.hasTable('attendance');
  if (!hasAttendance) {
    await knex.schema.createTable('attendance', (t) => {
      t.increments('id');
      t.integer('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.date('date').notNullable();
      t.time('clock_in');
      t.time('clock_out');
      t.enu('status', ['present', 'absent', 'late', 'half-day', 'on-leave']).defaultTo('present');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasPayroll = await knex.schema.hasTable('payroll');
  if (!hasPayroll) {
    await knex.schema.createTable('payroll', (t) => {
      t.increments('id');
      t.integer('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('period', 20).notNullable();
      t.decimal('base_salary', 12, 2).notNullable();
      t.decimal('bonuses', 12, 2).defaultTo(0);
      t.decimal('deductions', 12, 2).defaultTo(0);
      t.decimal('net_pay', 12, 2).notNullable();
      t.date('payment_date');
      t.enu('status', ['pending', 'paid', 'cancelled']).defaultTo('pending');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasPerformance = await knex.schema.hasTable('performance_reviews');
  if (!hasPerformance) {
    await knex.schema.createTable('performance_reviews', (t) => {
      t.increments('id');
      t.integer('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('reviewer_id').references('id').inTable('employees').onDelete('SET NULL');
      t.date('review_date').notNullable();
      t.decimal('rating', 3, 1);
      t.text('goals');
      t.text('achievements');
      t.text('areas_for_improvement');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasLeave = await knex.schema.hasTable('leave_requests');
  if (!hasLeave) {
    await knex.schema.createTable('leave_requests', (t) => {
      t.increments('id');
      t.integer('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('leave_type', 50).notNullable();
      t.date('start_date').notNullable();
      t.date('end_date').notNullable();
      t.enu('status', ['pending', 'approved', 'rejected', 'cancelled']).defaultTo('pending');
      t.text('reason');
      t.integer('approved_by').references('id').inTable('employees').onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasSuccession = await knex.schema.hasTable('succession_planning');
  if (!hasSuccession) {
    await knex.schema.createTable('succession_planning', (t) => {
      t.increments('id');
      t.string('position', 100).notNullable();
      t.integer('incumbent_id').references('id').inTable('employees').onDelete('SET NULL');
      t.integer('successor_id').references('id').inTable('employees').onDelete('SET NULL');
      t.enu('readiness', ['ready-now', 'ready-1-year', 'ready-2-years', 'development']).defaultTo('development');
      t.text('notes');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const count = await knex('employees').count('id as c').first();
  if (parseInt(count.c) === 0) {
    const employees = [
      { first_name: 'James', last_name: 'Mwangi', email: 'james.mwangi@sutana.co.ke', department: 'CEO', position: 'Chief Executive Officer', status: 'Active', join_date: '2019-01-15', salary: 850000, gender: 'Male', date_of_birth: '1975-03-12', phone: '0712345678' },
      { first_name: 'Grace', last_name: 'Wanjiku', email: 'grace.wanjiku@sutana.co.ke', department: 'CEO', position: 'Executive Assistant', status: 'Active', join_date: '2020-06-01', salary: 180000, gender: 'Female', date_of_birth: '1990-08-22', phone: '0723456789' },
      { first_name: 'Peter', last_name: 'Kamau', email: 'peter.kamau@sutana.co.ke', department: 'CEO', position: 'Strategy Director', status: 'Active', join_date: '2021-03-10', salary: 450000, gender: 'Male', date_of_birth: '1982-11-05', phone: '0734567890' },
      { first_name: 'Mary', last_name: 'Njoki', email: 'mary.njoki@sutana.co.ke', department: 'Admin', position: 'Admin Manager', status: 'Active', join_date: '2019-06-01', salary: 250000, gender: 'Female', date_of_birth: '1985-07-18', phone: '0745678901' },
      { first_name: 'David', last_name: 'Ochieng', email: 'david.ochieng@sutana.co.ke', department: 'Admin', position: 'HR Officer', status: 'Active', join_date: '2020-09-15', salary: 150000, gender: 'Male', date_of_birth: '1992-04-30', phone: '0756789012' },
      { first_name: 'Sarah', last_name: 'Akinyi', email: 'sarah.akinyi@sutana.co.ke', department: 'Admin', position: 'IT Support', status: 'Active', join_date: '2022-01-10', salary: 120000, gender: 'Female', date_of_birth: '1995-12-14', phone: '0767890123' },
      { first_name: 'Robert', last_name: 'Kiplagat', email: 'robert.kiplagat@sutana.co.ke', department: 'Finance', position: 'CFO', status: 'Active', join_date: '2019-03-01', salary: 750000, gender: 'Male', date_of_birth: '1978-09-20', phone: '0711111111' },
      { first_name: 'Jane', last_name: 'Wangui', email: 'jane.wangui@sutana.co.ke', department: 'Finance', position: 'Accountant', status: 'Active', join_date: '2020-04-01', salary: 200000, gender: 'Female', date_of_birth: '1988-06-12', phone: '0722222222' },
      { first_name: 'Samuel', last_name: 'Maina', email: 'samuel.maina@sutana.co.ke', department: 'Finance', position: 'Finance Officer', status: 'Active', join_date: '2021-07-20', salary: 160000, gender: 'Male', date_of_birth: '1991-02-28', phone: '0733333333' },
      { first_name: 'Emily', last_name: 'Chebet', email: 'emily.chebet@sutana.co.ke', department: 'Finance', position: 'Auditor', status: 'Active', join_date: '2022-05-15', salary: 180000, gender: 'Female', date_of_birth: '1993-10-05', phone: '0744444444' },
      { first_name: 'John', last_name: 'Mutua', email: 'john.mutua@sutana.co.ke', department: 'Printing', position: 'Production Manager', status: 'Active', join_date: '2019-08-01', salary: 300000, gender: 'Male', date_of_birth: '1980-05-22', phone: '0755555555' },
      { first_name: 'Esther', last_name: 'Nyambura', email: 'esther.nyambura@sutana.co.ke', department: 'Printing', position: 'Senior Printer', status: 'Active', join_date: '2020-02-15', salary: 200000, gender: 'Female', date_of_birth: '1987-11-15', phone: '0766666666' },
      { first_name: 'Patrick', last_name: 'Omondi', email: 'patrick.omondi@sutana.co.ke', department: 'Printing', position: 'Graphic Designer', status: 'Active', join_date: '2021-06-01', salary: 160000, gender: 'Male', date_of_birth: '1994-03-08', phone: '0777777777' },
      { first_name: 'Faith', last_name: 'Wairimu', email: 'faith.wairimu@sutana.co.ke', department: 'Printing', position: 'Quality Control', status: 'Active', join_date: '2022-04-10', salary: 130000, gender: 'Female', date_of_birth: '1996-09-25', phone: '0788888888' },
      { first_name: 'Joseph', last_name: 'Kiprop', email: 'joseph.kiprop@sutana.co.ke', department: 'Purchase', position: 'Procurement Manager', status: 'Active', join_date: '2019-05-20', salary: 280000, gender: 'Male', date_of_birth: '1983-12-01', phone: '0799999999' },
      { first_name: 'Alice', last_name: 'Mwende', email: 'alice.mwende@sutana.co.ke', department: 'Purchase', position: 'Buyer', status: 'Active', join_date: '2020-08-10', salary: 140000, gender: 'Female', date_of_birth: '1990-04-18', phone: '0700000000' },
      { first_name: 'Michael', last_name: 'Njoroge', email: 'michael.njoroge@sutana.co.ke', department: 'Sales', position: 'Sales Manager', status: 'Active', join_date: '2019-02-01', salary: 320000, gender: 'Male', date_of_birth: '1981-07-14', phone: '0701111111' },
      { first_name: 'Susan', last_name: 'Achieng', email: 'susan.achieng@sutana.co.ke', department: 'Sales', position: 'Sales Representative', status: 'Active', join_date: '2020-03-15', salary: 150000, gender: 'Female', date_of_birth: '1992-10-30', phone: '0702222222' },
      { first_name: 'Daniel', last_name: 'Kariuki', email: 'daniel.kariuki@sutana.co.ke', department: 'Sales', position: 'Sales Representative', status: 'Active', join_date: '2021-09-01', salary: 150000, gender: 'Male', date_of_birth: '1993-08-05', phone: '0703333333' },
      { first_name: 'Hannah', last_name: 'Wambui', email: 'hannah.wambui@sutana.co.ke', department: 'Inventory', position: 'Warehouse Manager', status: 'Active', join_date: '2019-10-01', salary: 220000, gender: 'Female', date_of_birth: '1986-03-22', phone: '0704444444' },
      { first_name: 'Thomas', last_name: 'Odhiambo', email: 'thomas.odhiambo@sutana.co.ke', department: 'Inventory', position: 'Stock Keeper', status: 'Active', join_date: '2020-11-20', salary: 110000, gender: 'Male', date_of_birth: '1994-07-11', phone: '0705555555' },
      { first_name: 'Catherine', last_name: 'Ndungu', email: 'catherine.ndungu@sutana.co.ke', department: 'Customer', position: 'Customer Service Manager', status: 'Active', join_date: '2020-01-15', salary: 200000, gender: 'Female', date_of_birth: '1988-12-19', phone: '0706666666' },
      { first_name: 'Kevin', last_name: 'Kibet', email: 'kevin.kibet@sutana.co.ke', department: 'Customer', position: 'Customer Service Rep', status: 'Active', join_date: '2022-02-01', salary: 90000, gender: 'Male', date_of_birth: '1997-05-30', phone: '0707777777' },
      { first_name: 'Diana', last_name: 'Chepkoech', email: 'diana.chepkoech@sutana.co.ke', department: 'Farming', position: 'Farm Manager', status: 'Active', join_date: '2020-05-01', salary: 200000, gender: 'Female', date_of_birth: '1984-09-14', phone: '0708888888' },
      { first_name: 'Paul', last_name: 'Kiprono', email: 'paul.kiprono@sutana.co.ke', department: 'Farming', position: 'Farm Worker', status: 'Active', join_date: '2021-04-10', salary: 70000, gender: 'Male', date_of_birth: '1995-01-25', phone: '0709999999' },
      { first_name: 'Lydia', last_name: 'Jeruto', email: 'lydia.jeruto@sutana.co.ke', department: 'Pharmacy', position: 'Pharmacist', status: 'Active', join_date: '2020-07-01', salary: 250000, gender: 'Female', date_of_birth: '1987-06-08', phone: '0710101010' },
      { first_name: 'George', last_name: 'Mwita', email: 'george.mwita@sutana.co.ke', department: 'Pharmacy', position: 'Pharmacy Assistant', status: 'Active', join_date: '2022-03-15', salary: 80000, gender: 'Male', date_of_birth: '1996-11-20', phone: '0711112121' },
      { first_name: 'Monica', last_name: 'Atieno', email: 'monica.atieno@sutana.co.ke', department: 'Car Renting', position: 'Fleet Manager', status: 'Active', join_date: '2021-01-10', salary: 220000, gender: 'Female', date_of_birth: '1986-08-16', phone: '0712121313' },
      { first_name: 'Brian', last_name: 'Ouma', email: 'brian.ouma@sutana.co.ke', department: 'Car Renting', position: 'Rental Agent', status: 'Active', join_date: '2022-06-01', salary: 90000, gender: 'Male', date_of_birth: '1997-02-28', phone: '0713131414' },
      { first_name: 'Nancy', last_name: 'Wanjala', email: 'nancy.wanjala@sutana.co.ke', department: 'Printing', position: 'Printer', status: 'Inactive', join_date: '2021-03-01', salary: 120000, gender: 'Female', date_of_birth: '1993-12-10', phone: '0714141515' },
      { first_name: 'Mark', last_name: 'Njenga', email: 'mark.njenga@sutana.co.ke', department: 'Sales', position: 'Cashier', status: 'Inactive', join_date: '2021-08-15', salary: 70000, gender: 'Male', date_of_birth: '1998-04-05', phone: '0715151616' },
    ];

    await knex('employees').insert(employees);

    const empRows = await knex('employees').select('id', 'position');

    const payrollData = [
      { period: '2025-Q1', status: 'paid', payment_date: '2025-01-25' },
      { period: '2025-Q1', status: 'paid', payment_date: '2025-02-25' },
      { period: '2025-Q1', status: 'paid', payment_date: '2025-03-25' },
      { period: '2025-Q2', status: 'paid', payment_date: '2025-04-25' },
      { period: '2025-Q2', status: 'paid', payment_date: '2025-05-25' },
      { period: '2025-Q2', status: 'pending', payment_date: null },
    ];

    for (const emp of empRows) {
      const baseSalary = emp.position.includes('CEO') ? 850000 :
        emp.position.includes('CFO') ? 750000 :
        emp.position.includes('Manager') || emp.position.includes('Director') ? ((Math.random() * 200000) + 200000) :
        emp.position.includes('Officer') || emp.position.includes('Accountant') ? ((Math.random() * 80000) + 120000) :
        ((Math.random() * 50000) + 70000);

      for (const p of payrollData) {
        const bonuses = Math.random() > 0.7 ? Math.round(baseSalary * 0.1) : 0;
        const deductions = Math.round(baseSalary * 0.05);
        const netPay = baseSalary + bonuses - deductions;
        await knex('payroll').insert({
          employee_id: emp.id,
          period: p.period,
          base_salary: Math.round(baseSalary),
          bonuses,
          deductions,
          net_pay: Math.round(netPay),
          payment_date: p.payment_date,
          status: p.status
        });
      }
    }

    const attendanceEmployees = empRows.filter(e => e.position !== 'Chief Executive Officer');
    const now = new Date();
    for (let d = 0; d < 60; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const dateStr = date.toISOString().split('T')[0];
      for (const emp of attendanceEmployees) {
        const r = Math.random();
        const status = r < 0.75 ? 'present' : r < 0.88 ? 'late' : r < 0.95 ? 'absent' : 'on-leave';
        const clockIn = status === 'absent' ? null : status === 'late' ? '08:45:00' : '08:00:00';
        const clockOut = status === 'absent' ? null : '17:00:00';
        await knex('attendance').insert({
          employee_id: emp.id,
          date: dateStr,
          clock_in: clockIn,
          clock_out: clockOut,
          status
        });
      }
    }

    for (const emp of empRows) {
      await knex('performance_reviews').insert({
        employee_id: emp.id,
        reviewer_id: empRows.find(e => e.position.includes('Manager') || e.position.includes('CEO') || e.position.includes('Director'))?.id || emp.id,
        review_date: '2025-03-15',
        rating: Math.round((3 + Math.random() * 2) * 10) / 10,
        goals: 'Improve operational efficiency and meet quarterly targets',
        achievements: 'Successfully completed all assigned projects',
        areas_for_improvement: 'Time management and cross-team collaboration',
        notes: 'Demonstrates good potential for growth'
      });
    }

    for (const emp of attendanceEmployees) {
      const r = Math.random();
      if (r < 0.3) {
        const start = new Date(2025, 0, Math.floor(Math.random() * 28) + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + Math.floor(Math.random() * 5) + 1);
        const leaveTypes = ['annual', 'sick', 'personal', 'maternity'];
        await knex('leave_requests').insert({
          employee_id: emp.id,
          leave_type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
          status: Math.random() > 0.2 ? 'approved' : 'pending',
          reason: 'Personal leave request',
          approved_by: empRows.find(e => e.position.includes('Manager') || e.position.includes('Director'))?.id || null
        });
      }
    }

    const successionRoles = [
      { position: 'Chief Executive Officer', readiness: 'ready-1-year', notes: 'Grooming Strategy Director as successor' },
      { position: 'CFO', readiness: 'ready-2-years', notes: 'Senior Accountant being developed for CFO role' },
      { position: 'Production Manager', readiness: 'ready-now', notes: 'Senior Printer ready to step up' },
      { position: 'Sales Manager', readiness: 'ready-1-year', notes: 'Top Sales Rep identified as successor' },
      { position: 'Warehouse Manager', readiness: 'development', notes: 'Stock Keeper enrolled in leadership program' },
    ];

    for (const sr of successionRoles) {
      const incumbent = empRows.find(e => e.position === sr.position);
      const successors = empRows.filter(e =>
        sr.position === 'Chief Executive Officer' ? e.position === 'Strategy Director' :
        sr.position === 'CFO' ? e.position === 'Accountant' :
        sr.position === 'Production Manager' ? e.position === 'Senior Printer' :
        sr.position === 'Sales Manager' ? e.position === 'Sales Representative' :
        sr.position === 'Warehouse Manager' ? e.position === 'Stock Keeper' : false
      );
      await knex('succession_planning').insert({
        position: sr.position,
        incumbent_id: incumbent?.id || null,
        successor_id: successors[0]?.id || null,
        readiness: sr.readiness,
        notes: sr.notes
      });
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('succession_planning');
  await knex.schema.dropTableIfExists('leave_requests');
  await knex.schema.dropTableIfExists('performance_reviews');
  await knex.schema.dropTableIfExists('payroll');
  await knex.schema.dropTableIfExists('attendance');
  const hasSalary = await knex.schema.hasColumn('employees', 'salary');
  if (hasSalary) {
    await knex.schema.table('employees', (t) => {
      t.dropColumn('salary');
      t.dropColumn('gender');
      t.dropColumn('date_of_birth');
      t.dropColumn('phone');
      t.dropColumn('address');
      t.dropColumn('user_id');
    });
  }
};
