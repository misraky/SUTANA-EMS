import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './CEOHome.module.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];
const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' }
];

const mockOverview = () => ({
  revenue: 2450000, revenueGrowth: 12.5, revenuePrevGrowth: -3.2, revenueTarget: 3000000,
  revenueSparkline: Array.from({length: 8}, (_, i) => 1800000 + Math.sin(i * 0.6) * 200000 + i * 80000),
  profit: 490000, profitGrowth: 8.3, profitPrevGrowth: 2.1, profitTarget: 600000,
  profitSparkline: Array.from({length: 8}, (_, i) => 350000 + Math.sin(i * 0.5) * 50000 + i * 20000),
  dailySalesActual: 82000, dailySalesTarget: 100000,
  customerSatisfaction: 87.5, satisfactionTarget: 90, satisfactionTrend: 2.1,
  cashPosition: 1850000, cashForecast: 'positive', cashPositionChange: 3.2,
  inventoryTurnover: 6.2, inventoryTarget: 8.0, inventoryTrend: -0.8,
});

const mockRevExpenses = () =>
  ['Jan','Feb','Mar','Apr','May','Jun'].map((m, i) => ({
    month: m, revenue: 350000 + Math.sin(i * 0.7) * 50000 + i * 25000,
    expenses: 280000 + Math.cos(i * 0.5) * 40000 + i * 15000,
    target: 400000 + i * 20000,
  }));

const mockCashFlow = () => ({
  summary: { totalInflow: 1250000, totalOutflow: 980000, netFlow: 270000 },
  periods: Array.from({length: 13}, (_, i) => ({
    period: `W${i + 1}`, Inflow: 90000 + Math.sin(i * 0.8) * 15000 + i * 2000,
    Outflow: 75000 + Math.cos(i * 0.6) * 12000 + i * 1500,
    Net: 15000 + Math.sin(i * 0.4) * 8000 + i * 500,
  })),
});

const mockProjection = () =>
  Array.from({length: 13}, (_, i) => ({
    period: `W${i + 1}`,
    projected: 1850000 + i * 25000 + Math.sin(i * 0.5) * 50000,
    upperBound: 1850000 + i * 35000 + Math.sin(i * 0.5) * 50000 + 80000,
    lowerBound: 1850000 + i * 15000 + Math.sin(i * 0.5) * 50000 - 80000,
  }));

const mockSectors = () => [
  { sector: 'Printing', revenue: 820000, color: '#3B82F6' },
  { sector: 'Sales', revenue: 650000, color: '#10B981' },
  { sector: 'Design', revenue: 430000, color: '#F59E0B' },
  { sector: 'Consulting', revenue: 320000, color: '#8B5CF6' },
  { sector: 'Logistics', revenue: 230000, color: '#EF4444' },
];

const mockAlerts = () => [
  { id: 1, title: 'Revenue Target at Risk', message: 'Q2 revenue is 15% behind target. Immediate action needed to close pipeline deals.', severity: 'critical', createdAt: new Date(Date.now() - 3600000).toISOString(), actionUrl: '/ceo/reports', actionText: 'View Report' },
  { id: 2, title: 'Cash Flow Warning', message: 'Operating cash flow projected to dip below minimum threshold next month.', severity: 'warning', createdAt: new Date(Date.now() - 7200000).toISOString(), actionUrl: '/ceo/cash-flow', actionText: 'Review' },
  { id: 3, title: 'Inventory Stock Alert', message: '3 key SKUs are below reorder point. Production delay risk.', severity: 'info', createdAt: new Date(Date.now() - 14400000).toISOString(), actionUrl: '/inventory', actionText: 'Check Inventory' },
];

const mockKpiHistory = () =>
  Array.from({length: 12}, (_, i) => ({ period: `M${i + 1}`, value: 200000 + Math.sin(i * 0.8) * 40000 + i * 15000 }));

const TrendArrow = ({ type }) => {
  if (type === 'up') return <span className={styles.trendArrowUp}>&#8593;</span>;
  if (type === 'down') return <span className={styles.trendArrowDown}>&#8595;</span>;
  return <span className={styles.trendArrowNeutral}>&#8594;</span>;
};

const KpiDrilldownModal = ({ kpi, onClose }) => {
  if (!kpi) return null;
  const history = kpi.history || mockKpiHistory();
  const status = kpi.status || (kpi.current >= kpi.target ? 'on_track' : kpi.current >= kpi.target * 0.85 ? 'at_risk' : 'behind');
  const statusLabel = status === 'on_track' ? 'On Track' : status === 'at_risk' ? 'At Risk' : 'Behind';
  const statusColor = status === 'on_track' ? '#10B981' : status === 'at_risk' ? '#F59E0B' : '#EF4444';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>&#10005;</button>
        <h2 className={styles.modalTitle}>{kpi.label}</h2>
        <div className={styles.modalBody}>
          <div className={styles.modalComparison}>
            <div className={styles.modalStat}>
              <span className={styles.modalStatLabel}>Current</span>
              <span className={styles.modalStatValue}>{kpi.currentFormatted || formatCurrency(kpi.current || 0)}</span>
            </div>
            <div className={styles.modalStat}>
              <span className={styles.modalStatLabel}>Target</span>
              <span className={styles.modalStatValue}>{kpi.targetFormatted || formatCurrency(kpi.target || 0)}</span>
            </div>
            <div className={styles.modalStat}>
              <span className={styles.modalStatLabel}>Previous</span>
              <span className={styles.modalStatValue}>{kpi.previousFormatted || formatCurrency(kpi.previous || 0)}</span>
            </div>
          </div>
          <div className={styles.modalStatus} style={{ color: statusColor }}>
            <span className={styles.modalStatusDot} style={{ background: statusColor }} />
            {statusLabel}
          </div>
          <div className={styles.modalChart}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" fontSize={11} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="rgba(59,130,246,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.modalActions}>
            <h4 className={styles.modalActionsTitle}>Suggested Actions</h4>
            <ul className={styles.modalActionsList}>
              {kpi.suggestions && kpi.suggestions.length > 0 ? kpi.suggestions.map((s, i) => (
                <li key={i} className={styles.modalActionItem}>{s}</li>
              )) : (
                <>
                  <li className={styles.modalActionItem}>Review current strategy and adjust targets if needed</li>
                  <li className={styles.modalActionItem}>Analyze contributing factors and identify improvement areas</li>
                  <li className={styles.modalActionItem}>Schedule review meeting with department heads</li>
                </>
              )}
            </ul>
            </div>
          </div>
        </div>
      </div>
  );
};

const DEPT_ICONS = {
  'Printing': <Printer size={16} />,
  'Pharmacy': <Pill size={16} />,
  'Car Rental': <Car size={16} />,
  'Farming': <Sprout size={16} />,
  'Retail': <Store size={16} />,
  'Admin': <ClipboardList size={16} />,
  'IT': <Monitor size={16} />,
};

const formatTime = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatETDate = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' });
};

const CEOHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hrSummary, setHrSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [dailyShifts, setDailyShifts] = useState([]);
  const [payrollData, setPayrollData] = useState(null);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empAttendanceHistory, setEmpAttendanceHistory] = useState([]);
  const [empDetailLoading, setEmpDetailLoading] = useState(false);
  const [clockingId, setClockingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  const fetchDashboard = async () => {
    try {
      const [hrRes, empAttRes] = await Promise.all([
        ceoService.getHRSummary(),
        ceoService.getDailyEmployees().catch((e) => { console.warn('getDailyEmployees failed:', e?.message); return { status: 'success', data: { employees: [], attendance: [], farmingShifts: [] } }; }),
      ]);
      const hr = hrRes?.data || {};
      setHrSummary(hr);
      const empList = empAttRes?.data?.employees || [];
      const hrAttList = empAttRes?.data?.attendance || [];
      const farmShifts = empAttRes?.data?.farmingShifts || [];

      const empMap = {};
      empList.forEach(e => { empMap[e.employee_id || e.id] = e; });
      hrAttList.forEach(a => {
        const eid = a.employee_id;
        if (eid && !empMap[eid]) {
          empMap[eid] = {
            employee_id: eid, id: eid,
            full_name: a.employee_name || 'Unknown',
            department: a.department || 'Unknown',
            position: a.position || null, phone: '-', status: 'Active',
          };
        }
      });
      farmShifts.forEach(s => {
        const eid = s.employee_id;
        if (eid && !empMap[eid]) {
          empMap[eid] = {
            employee_id: eid, id: eid,
            full_name: s.full_name || 'Unknown',
            department: 'Farming', position: 'Farming Worker',
            phone: '-', status: 'Active',
          };
        }
      });

      setEmployees(Object.values(empMap));
      setDailyAttendance(hrAttList);
      setDailyShifts(farmShifts);
      try {
        const pRes = await hrService.getPayroll(currentMonth);
        setPayrollData(pRes?.payroll || pRes?.data?.payroll || null);
      } catch { /* payroll not available */ }
    } catch (err) { console.error('Failed to load CEO dashboard:', err); }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, currentMonth]);

  const handleClockIn = async (emp) => {
    const eid = emp.employee_id || emp.id;
    setClockingId(eid);
    try {
      await hrService.clockIn(eid, 'CEO_MANUAL');
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clock in');
    }
    setClockingId(null);
  };

  const handleClockOut = async (emp) => {
    const eid = emp.employee_id || emp.id;
    setClockingId(eid);
    try {
      await hrService.clockOut(eid, 'CEO_MANUAL');
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clock out');
    }
    setClockingId(null);
  };

  const openEmployeeDetail = async (emp) => {
    setSelectedEmployee(emp);
    setEmpDetailLoading(true);
    setEmpAttendanceHistory([]);
    try {
      const res = await ceoService.getEmployeeMonthlyAttendance(emp.employee_id || emp.id, currentMonth);
      setEmpAttendanceHistory(res?.data?.records || []);
    } catch { /* no history */ }
    setEmpDetailLoading(false);
  };

  const getEmpAttendance = (empId) => {
    const att = dailyAttendance.find(a => a.employee_id === empId);
    if (!att) return { clockIn: null, clockOut: null, status: 'Absent', records: [] };
    return {
      clockIn: att.clock_in ? { timestamp: att.clock_in } : null,
      clockOut: att.clock_out ? { timestamp: att.clock_out } : null,
      status: att.status || 'Present',
      records: [att]
    };
  };

  const getEmpShift = (empId) => {
    return dailyShifts.find(s => s.employee_id === empId) || null;
  };

  const deptList = ['Printing', 'Pharmacy', 'Car Rental', 'Farming', 'Retail', 'Admin', 'IT'];
  const filteredEmployees = selectedDept === 'All'
    ? employees
    : employees.filter(e => (e.department || '').toLowerCase() === selectedDept.toLowerCase());

  const deptBreakdown = deptList.map(dept => {
    const deptEmps = employees.filter(e => (e.department || '').toLowerCase() === dept.toLowerCase());
    const present = deptEmps.filter(e => {
      const att = getEmpAttendance(e.employee_id || e.id);
      return att.status !== 'Absent' && att.status !== 'On Leave';
    }).length;
    const absent = deptEmps.filter(e => {
      const att = getEmpAttendance(e.employee_id || e.id);
      return att.status === 'Absent';
    }).length;
    const onLeave = deptEmps.filter(e => e.status === 'On Leave').length;
    return { department: dept, headcount: deptEmps.length, present, absent, onLeave };
  });

  const absentToday = hrSummary ? Math.max(0, (hrSummary.activeEmployees || 0) - (hrSummary.presentToday || 0) - (hrSummary.onLeaveCount || 0)) : 0;

  const mgrAccuracy = hrSummary?.managerAccuracy || [];
  const payrollMetrics = payrollData ? {
    totalPayroll: payrollData.total_net || payrollData.totalNet || 0,
    employeeCount: payrollData.employee_count || payrollData.employeeCount || 0,
  } : { totalPayroll: hrSummary?.totalMonthlySalary || 0, employeeCount: hrSummary?.totalEmployees || 0 };

  const payrollItems = payrollData?.items || [];
  const roleSalaryMap = {};
  payrollItems.forEach(item => {
    const role = item.position || item.department || 'Unknown';
    if (!roleSalaryMap[role]) roleSalaryMap[role] = { total: 0, count: 0 };
    roleSalaryMap[role].total += item.net_salary || 0;
    roleSalaryMap[role].count += 1;
  });
  let highestRole = null, lowestRole = null;
  Object.entries(roleSalaryMap).forEach(([role, data]) => {
    const avg = data.total / data.count;
    if (!highestRole || avg > highestRole.avg) highestRole = { role, avg };
    if (!lowestRole || avg < lowestRole.avg) lowestRole = { role, avg };
  });

  const avgSalary = payrollMetrics.employeeCount > 0 ? payrollMetrics.totalPayroll / payrollMetrics.employeeCount : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#6b7280' }}>
      <div style={{ textAlign: 'center' }}><div className="spinner" style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div><p>Loading dashboard...</p></div>
    </div>
  );

  const kpiCards = [
    { icon: <Users size={22} />, label: 'Total Employees', value: formatNumber(hrSummary?.totalEmployees || 0), desc: 'Active staff across all departments', color: '#3b82f6' },
    { icon: <UserCheck size={22} />, label: 'Present Today', value: formatNumber(hrSummary?.presentToday || 0), desc: 'Employees clocked in today', color: '#10b981' },
    { icon: <UserX size={22} />, label: 'Absent Today', value: formatNumber(absentToday), desc: 'No clock-in record', color: '#ef4444' },
    { icon: <CalendarCheck size={22} />, label: 'On Leave', value: formatNumber(hrSummary?.onLeaveCount || 0), desc: 'Approved leave today', color: '#f59e0b' },
    { icon: <DollarSign size={22} />, label: 'Monthly Payroll', value: formatCurrency(payrollMetrics.totalPayroll), desc: 'Total salary cost', color: '#8b5cf6' },
    { icon: <Building2 size={22} />, label: 'Departments', value: '7', desc: 'Total departments', color: '#06b6d4' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>CEO Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Full company oversight & executive control</p>
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8', background: '#f1f5f9', padding: '4px 12px', borderRadius: 20 }}>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Metric</th>
              <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Value</th>
              <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {kpiCards.map((k, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 500 }}>
                  <span style={{ color: k.color }}>{k.icon}</span>{k.label}
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{k.value}</td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>{k.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={18} />Department Breakdown</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Department</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Headcount</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Present</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Absent</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>On Leave</th>
              </tr>
            </thead>
            <tbody>
              {deptBreakdown.map(d => (
                <tr key={d.department} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 500 }}>
                    {DEPT_ICONS[d.department] || <Building2 size={16} />}{d.department}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{d.headcount}</td>
                  <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 600 }}>{d.present}</td>
                  <td style={{ padding: '10px 12px', color: '#ef4444', fontWeight: 600 }}>{d.absent}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: 600 }}>{d.onLeave}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
        <h2 style={{ margin: 0, padding: '14px 16px 0', fontSize: 16, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={18} />Payroll Summary</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Icon</th>
              <th style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Metric</th>
              <th style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 16px', color: '#8b5cf6' }}><DollarSign size={16} /></td>
              <td style={{ padding: '10px 16px', color: '#374151', fontWeight: 500 }}>Total Monthly Payroll</td>
              <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(payrollMetrics.totalPayroll)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 16px', color: '#f59e0b' }}><Trophy size={16} /></td>
              <td style={{ padding: '10px 16px', color: '#374151', fontWeight: 500 }}>Highest Paid Role</td>
              <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>{highestRole ? `${highestRole.role} (${formatCurrency(highestRole.avg)})` : '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 16px', color: '#ef4444' }}><ArrowDown size={16} /></td>
              <td style={{ padding: '10px 16px', color: '#374151', fontWeight: 500 }}>Lowest Paid Role</td>
              <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>{lowestRole ? `${lowestRole.role} (${formatCurrency(lowestRole.avg)})` : '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 16px', color: '#3b82f6' }}><Users size={16} /></td>
              <td style={{ padding: '10px 16px', color: '#374151', fontWeight: 500 }}>Total Employees</td>
              <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>{formatNumber(payrollMetrics.employeeCount)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 16px', color: '#10b981' }}><Calculator size={16} /></td>
              <td style={{ padding: '10px 16px', color: '#374151', fontWeight: 500 }}>Average Salary</td>
              <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(avgSalary)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={18} />Manager Accuracy Report</h2>
        {mgrAccuracy.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569', width: 20 }}>Icon</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Manager</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Department</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Field Staff</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Avg Present %</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Absence %</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Flag</th>
                </tr>
              </thead>
              <tbody>
                {mgrAccuracy.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}><Users size={16} /></td>
                    <td style={{ padding: '8px 12px', fontWeight: 500, color: '#0f172a' }}>{m.managerName || '-'}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{m.department || '-'}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{m.fieldStaffCount || 0}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#10b981' }}>{m.avgPresentPct != null ? m.avgPresentPct + '%' : '-'}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#ef4444' }}>{m.absencePct != null ? m.absencePct + '%' : '-'}</td>
                    <td style={{ padding: '8px 12px' }}>{m.flagged ? <XCircle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#10b981" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>No manager accuracy data available.</div>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { icon: <FileText size={16} />, label: 'View Full Report', desc: 'Complete HR & payroll report', path: '/ceo/reports' },
            { icon: <Building2 size={16} />, label: 'Department Details', desc: 'Drill down by department', path: '/ceo/summary' },
            { icon: <DollarSign size={16} />, label: 'Payroll Details', desc: 'Monthly payroll breakdown', path: '/ceo/budget-workflow' },
            { icon: <TrendingUp size={16} />, label: 'Trend Analysis', desc: 'Headcount & cost trends', path: '/ceo/reports' },
            { icon: <Download size={16} />, label: 'Export Report', desc: 'Generate PDF/Excel report', path: '/ceo/reports' },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f8fafc'; }}>
              <span style={{ color: '#3b82f6', flexShrink: 0 }}>{a.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 14 }}>&rarr;</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>&#128101; Employee Attendance</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Department:</span>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, background: '#fff' }}>
              <option value="All">All</option>
              {deptList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>#</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Users size={12} style={{ marginRight: 4 }} />Employee Name</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Phone size={12} style={{ marginRight: 4 }} />Phone</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Building2 size={12} style={{ marginRight: 4 }} />Department</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Clock size={12} style={{ marginRight: 4 }} />Clock In</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Clock size={12} style={{ marginRight: 4 }} />Clock Out</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Timer size={12} style={{ marginRight: 4 }} />Duration</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Calendar size={12} style={{ marginRight: 4 }} />Date</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><LogIn size={12} style={{ marginRight: 4 }} />Shift Open</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><LogOut size={12} style={{ marginRight: 4 }} />Shift Close</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Circle size={12} style={{ marginRight: 4 }} />Status</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={12} style={{ padding: 24, textAlign: 'center', color: '#94a3a8' }}>No employees found.</td></tr>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const eid = emp.employee_id || emp.id;
                  const att = getEmpAttendance(eid);
                  const shift = getEmpShift(eid);
                  const hasClockIn = !!att.clockIn;
                  const hasClockOut = !!att.clockOut;
                  const dur = hasClockIn && hasClockOut
                    ? Math.round((new Date(att.clockOut.timestamp) - new Date(att.clockIn.timestamp)) / 3600000) + 'h'
                    : '-';
                  const status = att.status === 'On Leave' ? 'Leave' : att.status === 'Absent' ? 'Absent' : att.records.length > 0 ? 'Present' : 'Absent';
                  const statusColor = status === 'Present' ? '#10b981' : status === 'Leave' ? '#f59e0b' : '#ef4444';
                  const clocking = clockingId === eid;
                  const shiftOpen = shift && shift.opened_at ? formatTime(shift.opened_at) : '-';
                  const shiftClose = shift && shift.closed_at ? formatTime(shift.closed_at) : '-';
                  return (
                    <tr key={eid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', color: '#94a3a8' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#0f172a', cursor: 'pointer' }} onClick={() => openEmployeeDetail(emp)}><Users size={13} style={{ marginRight: 6, color: '#64748b' }} />{emp.full_name || emp.name || '-'}</td>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>{emp.phone || '-'}</td>
                      <td style={{ padding: '8px 10px', color: '#374151' }}><Building2 size={12} style={{ marginRight: 4, color: '#64748b' }} />{emp.department || '-'}</td>
                      <td style={{ padding: '8px 10px', color: '#374151', fontSize: 11 }}>{hasClockIn ? formatTime(att.clockIn.timestamp) : '-'}</td>
                      <td style={{ padding: '8px 10px', color: '#374151', fontSize: 11 }}>{hasClockOut ? formatTime(att.clockOut.timestamp) : '-'}</td>
                      <td style={{ padding: '8px 10px', color: '#374151', fontSize: 11 }}>{dur}</td>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>{today}</td>
                      <td style={{ padding: '8px 10px', color: '#374151', fontSize: 11 }}>{shiftOpen}</td>
                      <td style={{ padding: '8px 10px', color: '#374151', fontSize: 11 }}>{shiftClose}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: statusColor + '20', color: statusColor }}>
                          <Circle size={8} fill={statusColor} />{status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {hasClockOut ? (
                          <span style={{ fontSize: 10, color: '#94a3a8' }}>&#10003;</span>
                        ) : clocking ? (
                          <span style={{ fontSize: 10, color: '#94a3a8' }}>...</span>
                        ) : hasClockIn ? (
                          <button onClick={() => handleClockOut(emp)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #f59e0b', background: '#fffbeb', color: '#d97706', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Clock Out</button>
                        ) : status === 'Leave' ? (
                          <span style={{ fontSize: 10, color: '#94a3a8' }}>On Leave</span>
                        ) : (
                          <button onClick={() => handleClockIn(emp)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #10b981', background: '#f0fdf4', color: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Clock In</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedEmployee(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 700, width: '95%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>&#128100; Employee Details <span style={{ color: '#64748b', fontWeight: 400 }}>|</span> {selectedEmployee.full_name || selectedEmployee.name}</h3>
              <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280', padding: 4 }}>&times;</button>
            </div>

            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Personal Info</h4>
            <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569', width: 20 }}>Icon</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Field</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { icon: <Users size={14} />, field: 'Employee Name', value: selectedEmployee.full_name || selectedEmployee.name || '-' },
                    { icon: <Phone size={14} />, field: 'Phone', value: selectedEmployee.phone || '-' },
                    { icon: <Mail size={14} />, field: 'Email', value: selectedEmployee.email || '-' },
                    { icon: <Building2 size={14} />, field: 'Department', value: selectedEmployee.department || '-' },
                    { icon: <Briefcase size={14} />, field: 'Position', value: selectedEmployee.position || '-' },
                    { icon: <Calendar size={14} />, field: 'Join Date', value: selectedEmployee.join_date ? formatETDate(selectedEmployee.join_date) : '-' },
                  ].map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{f.icon}</td>
                      <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>{f.field}</td>
                      <td style={{ padding: '8px 12px', color: '#0f172a' }}>{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} />Attendance History &mdash; {currentMonth}</h4>
            {empDetailLoading ? (
              <div style={{ textAlign: 'center', color: '#94a3a8', padding: 20 }}>Loading...</div>
            ) : empAttendanceHistory.length > 0 ? (
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Calendar size={12} style={{ marginRight: 4 }} />Date</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Clock size={12} style={{ marginRight: 4 }} />Clock In</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Clock size={12} style={{ marginRight: 4 }} />Clock Out</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Timer size={12} style={{ marginRight: 4 }} />Duration</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><LogIn size={12} style={{ marginRight: 4 }} />Shift Open</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><LogOut size={12} style={{ marginRight: 4 }} />Shift Close</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}><Circle size={12} style={{ marginRight: 4 }} />Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empAttendanceHistory.map((rec, i) => {
                      const st = rec.status === 'Present' ? '#10b981' : rec.status === 'Late' ? '#f59e0b' : rec.status === 'Absent' ? '#ef4444' : '#94a3a8';
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 8px', color: '#374151' }}>{rec.work_date || formatETDate(rec.date) || '-'}</td>
                          <td style={{ padding: '6px 8px', fontSize: 11 }}>{formatTime(rec.clock_in || rec.clockIn)}</td>
                          <td style={{ padding: '6px 8px', fontSize: 11 }}>{formatTime(rec.clock_out || rec.clockOut)}</td>
                          <td style={{ padding: '6px 8px', fontSize: 11 }}>{rec.duration_minutes ? Math.round(rec.duration_minutes / 60) + 'h' : '-'}</td>
                          <td style={{ padding: '6px 8px', fontSize: 11 }}>{formatTime(rec.shift_open || rec.shiftOpen)}</td>
                          <td style={{ padding: '6px 8px', fontSize: 11 }}>{formatTime(rec.shift_close || rec.shiftClose)}</td>
                          <td style={{ padding: '6px 8px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: st + '20', color: st }}><Circle size={7} fill={st} />{rec.status || '-'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>No attendance records for this month.</div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={16} />Shift Tracking &mdash; {today}</h4>
            {(() => {
              const eid = selectedEmployee.employee_id || selectedEmployee.id;
              const att = getEmpAttendance(eid);
              const shift = getEmpShift(eid);
              const shiftOpen = shift && shift.opened_at ? formatTime(shift.opened_at) : '-';
              const shiftClose = shift && shift.closed_at ? formatTime(shift.closed_at) : '-';
              const totalMs = att.clockIn && att.clockOut ? new Date(att.clockOut.timestamp) - new Date(att.clockIn.timestamp) : 0;
              const totalHours = totalMs ? Math.round(totalMs / 3600000 * 100) / 100 : 0;
              const breakHours = totalHours > 8 ? 1 : 0;
              const netHours = totalHours > 0 ? totalHours - breakHours : 0;
              const shiftSt = totalHours === 0 ? 'Absent' : att.clockOut ? (totalHours > 8 ? 'Overtime' : 'Complete') : 'Incomplete';
              const shiftColors = { Complete: '#10b981', Incomplete: '#ef4444', Overtime: '#3b82f6', Absent: '#94a3a8' };
              const sc = shiftColors[shiftSt] || '#94a3a8';
              return (
                <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569', width: 20 }}>Icon</th>
                        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Field</th>
                        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#475569' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}><LogIn size={14} /></td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>Shift Open Time</td>
                        <td style={{ padding: '8px 12px', color: '#0f172a' }}>{shiftOpen}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}><LogOut size={14} /></td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>Shift Close Time</td>
                        <td style={{ padding: '8px 12px', color: '#0f172a' }}>{shiftClose}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}><Timer size={14} /></td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>Total Duration</td>
                        <td style={{ padding: '8px 12px', color: '#0f172a' }}>{totalHours > 0 ? totalHours.toFixed(2) + 'h' : '-'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}><Coffee size={14} /></td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>Break Duration</td>
                        <td style={{ padding: '8px 12px', color: '#0f172a' }}>{breakHours > 0 ? breakHours + 'h' : '-'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}><Clock size={14} /></td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>Net Work Hours</td>
                        <td style={{ padding: '8px 12px', color: '#0f172a' }}>{netHours > 0 ? netHours.toFixed(2) + 'h' : '-'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: sc }}><Circle size={14} /></td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>Shift Status</td>
                        <td style={{ padding: '8px 12px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: sc + '20', color: sc }}><Circle size={7} fill={sc} />{shiftSt}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Actions</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { icon: <Eye size={14} />, label: 'View Full Attendance', onClick: () => {} },
                { icon: <Calendar size={14} />, label: 'View Leave History', onClick: () => {} },
                { icon: <DollarSign size={14} />, label: 'View Salary Slip', onClick: () => {} },
                { icon: <Download size={14} />, label: 'Export Report', onClick: () => {} },
              ].map((act, i) => (
                <button key={i} onClick={act.onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#374151' }}>{act.icon}{act.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectorDrilldownModal = ({ sector, onClose }) => {
  if (!sector) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>&#10005;</button>
        <h2 className={styles.modalTitle}>{sector.sector} Sector Details</h2>
        <div className={styles.modalBody}>
          <div className={styles.sectorKpiGrid}>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Revenue</span>
              <span className={styles.sectorKpiValue}>{formatCurrency(sector.revenue)}</span>
              <span className={styles.sectorKpiDelta}>+12.5%</span>
            </div>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Profit</span>
              <span className={styles.sectorKpiValue}>{formatCurrency(sector.revenue * 0.2)}</span>
              <span className={styles.sectorKpiDelta}>+8.3%</span>
            </div>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Margin</span>
              <span className={styles.sectorKpiValue}>20.0%</span>
              <span className={styles.sectorKpiDelta}>+2.1%</span>
            </div>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Growth</span>
              <span className={styles.sectorKpiValue}>+15.2%</span>
              <span className={styles.sectorKpiDelta}>YoY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEOHome;


