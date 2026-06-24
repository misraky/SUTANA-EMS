const { db } = require('../config/database');

const getHRSummary = async () => {
  const total = await db('employees').count('id as count').first();
  const byDepartment = await db('employees').select('department').count('id as count').groupBy('department').orderBy('department');
  const byStatus = await db('employees').select('status').count('id as count').groupBy('status');
  const active = await db('employees').where('status', 'Active').count('id as count').first();
  const inactive = await db('employees').where('status', 'Inactive').count('id as count').first();
  const hiredThisYear = await db('employees').whereRaw('YEAR(join_date) = ?', [new Date().getFullYear()]).count('id as count').first();
  const departedThisYear = await db('employees').where('status', 'Inactive').whereRaw('YEAR(created_at) = ?', [new Date().getFullYear()]).count('id as count').first();
  const genderBreakdown = await db('employees').select('gender').count('id as count').groupBy('gender');
  const payrollTotal = await db('payroll').where('status', 'paid').sum('net_pay as total').first();
  const recentHires = await db('employees').where('status', 'Active').orderBy('join_date', 'desc').limit(5);
  const recentDepartures = await db('employees').where('status', 'Inactive').orderBy('created_at', 'desc').limit(5);

  let deptList = [];
  for (const d of byDepartment) {
    const payroll = await db('payroll as p').join('employees as e', 'p.employee_id', 'e.id').where('e.department', d.department).where('p.status', 'paid').avg('p.net_pay as avg').first();
    deptList.push({ department: d.department, count: parseInt(d.count), avgSalary: Math.round(parseFloat(payroll?.avg || 0)) });
  }

  return {
    totalEmployees: parseInt(total.count),
    activeEmployees: parseInt(active.count),
    inactiveEmployees: parseInt(inactive.count),
    hiredThisYear: parseInt(hiredThisYear.count),
    departedThisYear: parseInt(departedThisYear.count),
    genderBreakdown: genderBreakdown.map(g => ({ gender: g.gender || 'Unspecified', count: parseInt(g.count) })),
    totalPayrollPaid: Math.round(parseFloat(payrollTotal?.total || 0)),
    byDepartment: deptList,
    recentHires,
    recentDepartures
  };
};

const getAttritionData = async (period = 'quarter') => {
  const now = new Date();
  let intervals;

  if (period === 'year') {
    intervals = [];
    for (let y = 0; y < 5; y++) {
      const year = now.getFullYear() - y;
      intervals.push({ label: `${year}`, start: `${year}-01-01`, end: `${year}-12-31` });
    }
  } else {
    intervals = [];
    for (let q = 0; q < 8; q++) {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - q * 3;
      const year = now.getFullYear() + Math.floor(quarterStartMonth / 12);
      const month = ((quarterStartMonth % 12) + 12) % 12;
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endMonth = month + 3;
      const endYear = year + Math.floor(endMonth / 12);
      const em = (endMonth % 12) || 12;
      const endDate = new Date(endYear, em, 0);
      intervals.push({ label: `Q${(month / 3) + 1} ${year}`, start, end: endDate.toISOString().split('T')[0] });
    }
  }

  const results = [];
  for (const interval of intervals) {
    const hired = await db('employees').whereBetween('join_date', [interval.start, interval.end]).count('id as count').first();
    const departed = await db('employees').where('status', 'Inactive').whereBetween('created_at', [interval.start, interval.end]).count('id as count').first();
    const h = parseInt(hired.count);
    const d = parseInt(departed.count);
    const totalAtStart = await db('employees').where('join_date', '<', interval.start).count('id as count').first();
    const avgHeadcount = parseInt(totalAtStart.count) + Math.round(h / 2);
    const rate = avgHeadcount > 0 ? parseFloat(((d / avgHeadcount) * 100).toFixed(1)) : 0;
    results.push({ period: interval.label, hired: h, departed: d, attritionRate: rate });
  }

  const total = await db('employees').count('id as count').first();
  const active = await db('employees').where('status', 'Active').count('id as count').first();
  const overallRate = parseInt(total.count) > 0 ? parseFloat((((parseInt(total.count) - parseInt(active.count)) / parseInt(total.count)) * 100).toFixed(1)) : 0;

  return { intervals: results, overallAttritionRate: overallRate };
};

const getCompensationData = async () => {
  const byDepartment = await db('employees').select('department').avg('salary as avg').min('salary as min').max('salary as max').count('id as count').groupBy('department').orderBy('department');
  const byPosition = await db('employees').select('position').avg('salary as avg').min('salary as min').max('salary as max').count('id as count').groupBy('position').orderBy('position');
  const totalPayroll = await db('payroll').sum('net_pay as total').first();
  const salaryByGender = await db('employees').select('gender').avg('salary as avg').groupBy('gender');

  return {
    totalPayroll: Math.round(parseFloat(totalPayroll?.total || 0)),
    byDepartment: byDepartment.map(d => ({
      department: d.department,
      employeeCount: parseInt(d.count),
      avgSalary: Math.round(parseFloat(d.avg || 0)),
      minSalary: Math.round(parseFloat(d.min || 0)),
      maxSalary: Math.round(parseFloat(d.max || 0))
    })),
    byPosition: byPosition.map(p => ({
      position: p.position,
      employeeCount: parseInt(p.count),
      avgSalary: Math.round(parseFloat(p.avg || 0)),
      minSalary: Math.round(parseFloat(p.min || 0)),
      maxSalary: Math.round(parseFloat(p.max || 0))
    })),
    salaryByGender: salaryByGender.map(g => ({ gender: g.gender || 'Unspecified', avgSalary: Math.round(parseFloat(g.avg || 0)) }))
  };
};

const getSuccessionPipeline = async () => {
  const pipeline = await db('succession_planning as sp')
    .leftJoin('employees as inc', 'sp.incumbent_id', 'inc.id')
    .leftJoin('employees as suc', 'sp.successor_id', 'suc.id')
    .select('sp.id', 'sp.position', 'sp.readiness', 'sp.notes',
      'inc.first_name as incumbent_first', 'inc.last_name as incumbent_last',
      'suc.first_name as successor_first', 'suc.last_name as successor_last',
      'suc.position as successor_current_position')
    .orderBy('sp.position');

  const byReadiness = await db('succession_planning').select('readiness').count('id as count').groupBy('readiness');
  const totalPositions = await db('succession_planning').count('id as count').first();
  const filled = await db('succession_planning').whereNotNull('successor_id').count('id as count').first();

  return {
    totalPositions: parseInt(totalPositions.count),
    filledPositions: parseInt(filled.count),
    coverageRate: parseInt(totalPositions.count) > 0 ? Math.round((parseInt(filled.count) / parseInt(totalPositions.count)) * 100) : 0,
    byReadiness: byReadiness.map(r => ({ readiness: r.readiness, count: parseInt(r.count) })),
    pipeline: pipeline.map(p => ({
      id: p.id,
      position: p.position,
      incumbent: p.incumbent_first ? `${p.incumbent_first} ${p.incumbent_last}` : 'Vacant',
      successor: p.successor_first ? `${p.successor_first} ${p.successor_last}` : null,
      successorCurrentPosition: p.successor_current_position,
      readiness: p.readiness,
      notes: p.notes
    }))
  };
};

const getDEIMetrics = async () => {
  const total = await db('employees').count('id as count').first();
  const genderByDept = await db('employees').select('department', 'gender').count('id as count').groupBy('department', 'gender').orderBy('department');
  const overallGender = await db('employees').select('gender').count('id as count').groupBy('gender');
  const unknownGender = await db('employees').whereNull('gender').count('id as count').first();

  const deptMap = {};
  for (const row of genderByDept) {
    if (!deptMap[row.department]) deptMap[row.department] = { department: row.department, male: 0, female: 0, other: 0, total: 0 };
    const key = (row.gender || 'other').toLowerCase();
    if (deptMap[row.department][key] !== undefined) deptMap[row.department][key] = parseInt(row.count);
    deptMap[row.department].total += parseInt(row.count);
  }

  const totalCount = parseInt(total.count);
  const femaleCount = overallGender.filter(g => g.gender === 'Female').reduce((s, r) => s + parseInt(r.count), 0);
  const maleCount = overallGender.filter(g => g.gender === 'Male').reduce((s, r) => s + parseInt(r.count), 0);

  return {
    totalEmployees: totalCount,
    femalePercentage: totalCount > 0 ? parseFloat(((femaleCount / totalCount) * 100).toFixed(1)) : 0,
    malePercentage: totalCount > 0 ? parseFloat(((maleCount / totalCount) * 100).toFixed(1)) : 0,
    unknownGender: parseInt(unknownGender.count),
    overallGender: overallGender.map(g => ({ gender: g.gender || 'Unspecified', count: parseInt(g.count) })),
    byDepartment: Object.values(deptMap)
  };
};

module.exports = { getHRSummary, getAttritionData, getCompensationData, getSuccessionPipeline, getDEIMetrics };
const bcrypt = require('bcrypt');

// ─────────────────────────────────────────────────────────────
// Employee ID Generator
// ─────────────────────────────────────────────────────────────
const generateEmployeeId = async () => {
  const now = new Date();
  const prefix = `EMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-`;
  const last = await db('employees').where('employee_id', 'like', `${prefix}%`).orderBy('employee_id', 'desc').first();
  const seq = last ? String(parseInt(last.employee_id.slice(-3)) + 1).padStart(3, '0') : '001';
  return `${prefix}${seq}`;
};

// ─────────────────────────────────────────────────────────────
// Employee CRUD
// ─────────────────────────────────────────────────────────────
const createEmployee = async (data) => {
  const employeeId = await generateEmployeeId();
  const passwordHash = await bcrypt.hash(data.password || '123456', 10);
  await db('employees').insert({
    employee_id: employeeId,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone || null,
    password_hash: passwordHash,
    position: data.position || null,
    department: data.department,
    join_date: data.joinDate || new Date(),
    base_salary: data.baseSalary || 0,
    allowance: data.allowance || 0,
    standing_deduction: data.standingDeduction || 0,
    payment_method: data.paymentMethod || 'Cash',
    bank_account: data.bankAccount || null,
    work_type: data.workType || 'Office',
    check_in_time: data.checkInTime || '08:30:00',
    check_out_time: data.checkOutTime || '17:30:00',
    lunch_break_minutes: data.lunchBreakMinutes || 60,
    work_days_per_month: data.workDaysPerMonth || 22,
    status: 'Active',
    user_id: data.userId || null,
  });
  return employeeId;
};

const updateEmployee = async (id, data) => {
  const updates = {};
  if (data.fullName !== undefined) updates.full_name = data.fullName;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.position !== undefined) updates.position = data.position;
  if (data.department !== undefined) updates.department = data.department;
  if (data.baseSalary !== undefined) updates.base_salary = data.baseSalary;
  if (data.allowance !== undefined) updates.allowance = data.allowance;
  if (data.standingDeduction !== undefined) updates.standing_deduction = data.standingDeduction;
  if (data.paymentMethod !== undefined) updates.payment_method = data.paymentMethod;
  if (data.bankAccount !== undefined) updates.bank_account = data.bankAccount;
  if (data.workType !== undefined) updates.work_type = data.workType;
  if (data.status !== undefined) updates.status = data.status;
  if (data.checkInTime !== undefined) updates.check_in_time = data.checkInTime;
  if (data.checkOutTime !== undefined) updates.check_out_time = data.checkOutTime;
  updates.updated_at = db.fn.now();
  await db('employees').where('employee_id', id).update(updates);
};

const getEmployees = async (params = {}) => {
  let query = db('employees').select('*');
  if (params.department) query = query.where('department', params.department);
  if (params.status) query = query.where('status', params.status);
  if (params.search) {
    query = query.where(function () {
      this.where('full_name', 'like', `%${params.search}%`)
        .orWhere('email', 'like', `%${params.search}%`)
        .orWhere('employee_id', 'like', `%${params.search}%`);
    });
  }
  return query.orderBy('full_name');
};

const getEmployeeById = async (id) => {
  return db('employees').where('employee_id', id).first();
};

const authenticateEmployee = async (employeeId, password) => {
  const emp = await db('employees').where('employee_id', employeeId).where('status', 'Active').first();
  if (!emp) return null;
  const valid = await bcrypt.compare(password, emp.password_hash);
  if (!valid) return null;
  return emp;
};

// ─────────────────────────────────────────────────────────────
// Computer Registration
// ─────────────────────────────────────────────────────────────
const registerComputer = async (data) => {
  await db('registered_computers').insert({
    computer_id: data.computerId,
    computer_name: data.computerName,
    location: data.location || null,
    department: data.department || null,
    mac_address: data.macAddress || null,
    ip_range: data.ipRange || null,
    status: 'Active',
  });
  return data.computerId;
};

const getRegisteredComputers = async () => {
  return db('registered_computers').where('status', 'Active').orderBy('computer_name');
};

const isComputerRegistered = async (computerId) => {
  const comp = await db('registered_computers').where('computer_id', computerId).where('status', 'Active').first();
  return !!comp;
};

// ─────────────────────────────────────────────────────────────
// Attendance / Clock-in / Clock-out
// Table: attendance_records
// Columns: id, employee_id, computer_id, action, status, timestamp, ip_address, work_date, notes, recorded_by
// ─────────────────────────────────────────────────────────────
const registerClock = async (employeeId, computerId, action, ip) => {
  if (!(await isComputerRegistered(computerId))) return { error: 'Computer not registered. Contact HR.' };

  const emp = await db('employees').where('employee_id', employeeId).where('status', 'Active').first();
  if (!emp) return { error: 'Employee not found or inactive.' };

  const now = new Date();
  const workDate = now.toISOString().split('T')[0];

  if (action === 'CLOCK_IN') {
    const existing = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_IN' }).first();
    if (existing) return { error: 'Already clocked in today.' };

    const clockedOut = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_OUT' }).first();
    if (clockedOut) return { error: 'Already clocked out today.' };

    const [id] = await db('attendance_records').insert({
      employee_id: employeeId,
      computer_id: computerId,
      action: 'CLOCK_IN',
      status: 'Present',
      timestamp: now,
      ip_address: ip,
      work_date: workDate,
      recorded_by: employeeId,
    });
    return { id, employeeId, action: 'CLOCK_IN', timestamp: now, workDate };

  } else if (action === 'CLOCK_OUT') {
    const clockIn = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_IN' }).first();
    if (!clockIn) return { error: 'No clock-in record found for today.' };

    const existingOut = await db('attendance_records')
      .where({ employee_id: employeeId, work_date: workDate, action: 'CLOCK_OUT' }).first();
    if (existingOut) return { error: 'Already clocked out today.' };

    const [id] = await db('attendance_records').insert({
      employee_id: employeeId,
      computer_id: computerId,
      action: 'CLOCK_OUT',
      status: 'Present',
      timestamp: now,
      ip_address: ip,
      work_date: workDate,
      recorded_by: employeeId,
    });
    return { id, employeeId, action: 'CLOCK_OUT', timestamp: now, workDate };
  }
  return { error: 'Invalid action' };
};

const getTodayAttendance = async (employeeId) => {
  const today = new Date().toISOString().split('T')[0];
  const records = await db('attendance_records')
    .where({ employee_id: employeeId, work_date: today })
    .orderBy('timestamp');
  const clockIn = records.find(r => r.action === 'CLOCK_IN');
  const clockOut = records.find(r => r.action === 'CLOCK_OUT');
  return { employeeId, date: today, clockIn: clockIn || null, clockOut: clockOut || null };
};

const getMonthlyAttendance = async (employeeId, month) => {
  const [year, m] = month.split('-');
  const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
  const startDate = `${month}-01`;
  const endDate = `${month}-${daysInMonth}`;
  const records = await db('attendance_records')
    .where('employee_id', employeeId)
    .whereBetween('work_date', [startDate, endDate])
    .orderBy('work_date');
  return records;
};

const getDailyAttendances = async (date) => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  return db('attendance_records as ar')
    .leftJoin('employees as e', 'ar.employee_id', 'e.employee_id')
    .where('ar.work_date', targetDate)
    .select('ar.*', 'e.full_name', 'e.department', 'e.position');
};

// ─────────────────────────────────────────────────────────────
// Leave Requests
// ─────────────────────────────────────────────────────────────
const createLeaveRequest = async (data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const [id] = await db('leave_requests').insert({
    employee_id: data.employeeId,
    leave_type_id: data.leaveTypeId || null,
    leave_type: data.leaveType || 'Annual Leave',
    start_date: data.startDate,
    end_date: data.endDate,
    total_days: totalDays,
    reason: data.reason,
    status: 'Pending',
  });
  return id;
};

const getLeaveRequests = async (params = {}) => {
  let query = db('leave_requests as lr')
    .leftJoin('employees as e', 'lr.employee_id', 'e.employee_id')
    .leftJoin('leave_types as lt', 'lr.leave_type_id', 'lt.id')
    .select('lr.*', 'e.full_name', 'e.department', 'lt.name as leave_type_name', 'lt.is_paid');
  if (params.employeeId) query = query.where('lr.employee_id', params.employeeId);
  if (params.status) query = query.where('lr.status', params.status);
  return query.orderBy('lr.created_at', 'desc');
};

const approveLeave = async (id, reviewerId, status, rejectionReason) => {
  const update = { status, reviewed_by: reviewerId, updated_at: db.fn.now() };
  if (rejectionReason) update.rejection_reason = rejectionReason;
  await db('leave_requests').where('id', id).update(update);
};

// ─────────────────────────────────────────────────────────────
// HR Summary (for dashboard)
// ─────────────────────────────────────────────────────────────
const getHRSummary = async () => {
  const total = await db('employees').count('employee_id as count').first();
  const active = await db('employees').where('status', 'Active').count('employee_id as count').first();
  const onLeave = await db('employees').where('status', 'On Leave').count('employee_id as count').first();
  const inactive = await db('employees').where('status', 'Inactive').count('employee_id as count').first();
  const deptBreakdown = await db('employees').select('department').count('employee_id as count').groupBy('department');
  const today = new Date().toISOString().split('T')[0];
  const presentToday = await db('attendance_records')
    .where('work_date', today).where('action', 'CLOCK_IN').countDistinct('employee_id as count').first();
  const pendingLeaves = await db('leave_requests').where('status', 'Pending').count('id as count').first();
  const totalSalary = await db('employees').where('status', 'Active').sum('base_salary as total').first();
  return {
    totalEmployees: parseInt(total.count),
    activeEmployees: parseInt(active.count),
    onLeaveCount: parseInt(onLeave.count),
    inactiveCount: parseInt(inactive.count),
    departmentBreakdown: deptBreakdown.map(d => ({ department: d.department, count: parseInt(d.count) })),
    presentToday: parseInt(presentToday.count),
    pendingLeaves: parseInt(pendingLeaves.count),
    totalMonthlySalary: parseFloat(totalSalary.total || 0),
  };
};

// ─────────────────────────────────────────────────────────────
// Payroll
// ─────────────────────────────────────────────────────────────
const calculatePayroll = async (month) => {
  const employees = await db('employees').where('status', 'Active');
  const items = [];
  let totalBase = 0, totalBonus = 0, totalDed = 0, totalNet = 0;
  const [yearStr, monthStr] = month.split('-');
  const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
  const workDaysPerMonth = 22;

  for (const emp of employees) {
    const dailyRate = parseFloat(emp.base_salary) / workDaysPerMonth;
    const startDate = `${month}-01`;
    const endDate = `${month}-${daysInMonth}`;

    // Get attendance records for this month
    const attendanceRecords = await db('attendance_records')
      .where('employee_id', emp.employee_id)
      .whereBetween('work_date', [startDate, endDate])
      .orderBy('work_date', 'asc');

    const daysPresent = new Set();
    for (const r of attendanceRecords) {
      if (r.action === 'CLOCK_IN') daysPresent.add(r.work_date);
    }

    // Get approved leaves for this month
    const leaveDays = await db('leave_requests')
      .leftJoin('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
      .where('leave_requests.employee_id', emp.employee_id)
      .where('leave_requests.status', 'Approved')
      .whereBetween('leave_requests.start_date', [startDate, endDate])
      .select('leave_requests.*', 'leave_types.is_paid');

    let totalPresent = daysPresent.size;
    let daysPaid = totalPresent;

    for (const l of leaveDays) {
      const ld = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1;
      if (l.is_paid) daysPaid += ld;
    }

    const daysAbsent = Math.max(0, workDaysPerMonth - daysPaid);
    const absenceDeduction = daysAbsent * dailyRate;
    const standingDed = parseFloat(emp.standing_deduction) || 0;
    const totalDeductions = absenceDeduction + standingDed;
    const totalBonuses = parseFloat(emp.allowance) || 0;
    const netSalary = Math.max(0, parseFloat(emp.base_salary) + totalBonuses - totalDeductions);

    items.push({
      employee_id: emp.employee_id,
      base_salary: emp.base_salary,
      daily_rate: Math.round(dailyRate * 100) / 100,
      days_present: totalPresent,
      days_absent: daysAbsent,
      absence_deduction: Math.round(absenceDeduction),
      standing_deduction: standingDed,
      performance_bonus: totalBonuses,
      net_salary: Math.round(netSalary),
    });
    totalBase += parseFloat(emp.base_salary);
    totalBonus += totalBonuses;
    totalDed += totalDeductions;
    totalNet += netSalary;
  }

  // Insert or update payroll record
  const existing = await db('payroll').where('month', month).first();
  let payrollId;
  if (existing) {
    await db('payroll').where('month', month).update({
      status: 'Draft',
      total_base_salary: Math.round(totalBase),
      total_bonus: Math.round(totalBonus),
      total_deduction: Math.round(totalDed),
      total_net: Math.round(totalNet),
      employee_count: items.length,
      updated_at: db.fn.now(),
    });
    payrollId = existing.id;
    await db('payroll_items').where('payroll_id', payrollId).delete();
  } else {
    [payrollId] = await db('payroll').insert({
      month,
      status: 'Draft',
      total_base_salary: Math.round(totalBase),
      total_bonus: Math.round(totalBonus),
      total_deduction: Math.round(totalDed),
      total_net: Math.round(totalNet),
      employee_count: items.length,
    });
  }

  for (const item of items) {
    await db('payroll_items').insert({ ...item, payroll_id: payrollId });
  }

  return { payrollId, totalNet: Math.round(totalNet), employeeCount: items.length };
};

const getPayroll = async (month) => {
  const p = await db('payroll').where('month', month).first();
  if (!p) return null;
  const items = await db('payroll_items as pi')
    .leftJoin('employees as e', 'pi.employee_id', 'e.employee_id')
    .select('pi.*', 'e.full_name', 'e.department', 'e.position', 'e.payment_method', 'e.bank_account')
    .where('pi.payroll_id', p.id);
  return { ...p, items };
};

const sendPayrollToFinance = async (month, userId) => {
  await db('payroll').where('month', month).update({
    status: 'Sent',
    created_by: userId,
    sent_to_finance_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
};

const approvePayroll = async (month, userId) => {
  await db('payroll').where('month', month).update({
    status: 'Finance Approved',
    finance_approved_by: userId,
    approved_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
};

const markPayrollPaid = async (month, paymentMethod) => {
  await db('payroll').where('month', month).update({
    status: 'Paid',
    payment_method: paymentMethod,
    paid_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
};

// ─────────────────────────────────────────────────────────────
// Manager Accuracy Report (CEO view)
// ─────────────────────────────────────────────────────────────
const getManagerAccuracyReport = async () => {
  const managers = await db('employees')
    .whereIn('position', ['Manager', 'Supervisor'])
    .where('status', 'Active');
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = `${today.slice(0, 7)}-01`;
  const report = [];

  for (const m of managers) {
    const team = await db('employees').where('department', m.department).where('status', 'Active');
    if (team.length === 0) continue;
    let totalPresent = 0, totalAbsent = 0;
    for (const t of team) {
      const att = await db('attendance_records')
        .where('employee_id', t.employee_id)
        .whereBetween('work_date', [startOfMonth, today])
        .where('action', 'CLOCK_IN')
        .count('id as c').first();
      totalPresent += parseInt(att.c || 0);
    }
    const workingDays = 22;
    totalAbsent = Math.max(0, (team.length * workingDays) - totalPresent);
    const total = totalPresent + totalAbsent;
    report.push({
      managerName: m.full_name,
      department: m.department,
      fieldStaffCount: team.length,
      avgPresentPct: total > 0 ? Math.round((totalPresent / total) * 100) : 0,
      absencePct: total > 0 ? Math.round((totalAbsent / total) * 100) : 0,
      flagged: total > 0 && (totalAbsent / total) > 0.25,
    });
  }
  return report;
};

module.exports = {
  createEmployee, updateEmployee, getEmployees, getEmployeeById,
  authenticateEmployee, isComputerRegistered, registerClock,
  getTodayAttendance, getMonthlyAttendance, getDailyAttendances,
  registerComputer, getRegisteredComputers,
  createLeaveRequest, getLeaveRequests, approveLeave,
  getHRSummary, calculatePayroll, getPayroll,
  sendPayrollToFinance, approvePayroll, markPayrollPaid,
  getManagerAccuracyReport,
};
