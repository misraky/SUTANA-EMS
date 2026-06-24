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
