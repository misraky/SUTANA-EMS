import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './CEODashboard.module.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280', '#EC4899', '#14B8A6'];

const mockSummary = () => ({
  totalEmployees: 31,
  activeEmployees: 29,
  inactiveEmployees: 2,
  hiredThisYear: 5,
  departedThisYear: 1,
  totalPayrollPaid: 8250000,
  genderBreakdown: [{ gender: 'Male', count: 17 }, { gender: 'Female', count: 14 }],
  byDepartment: [
    { department: 'CEO', count: 3, avgSalary: 460000 },
    { department: 'Admin', count: 3, avgSalary: 173000 },
    { department: 'Finance', count: 4, avgSalary: 322000 },
    { department: 'Printing', count: 4, avgSalary: 152000 },
    { department: 'Purchase', count: 2, avgSalary: 210000 },
    { department: 'Sales', count: 4, avgSalary: 173000 },
    { department: 'Inventory', count: 2, avgSalary: 165000 },
    { department: 'Customer', count: 2, avgSalary: 145000 },
    { department: 'Farming', count: 2, avgSalary: 135000 },
    { department: 'Pharmacy', count: 2, avgSalary: 165000 },
    { department: 'Car Renting', count: 2, avgSalary: 155000 },
  ],
  recentHires: [
    { first_name: 'Sarah', last_name: 'Akinyi', department: 'Admin', position: 'IT Support', join_date: '2022-01-10' },
    { first_name: 'Brian', last_name: 'Ouma', department: 'Car Renting', position: 'Rental Agent', join_date: '2022-06-01' },
    { first_name: 'Kevin', last_name: 'Kibet', department: 'Customer', position: 'Customer Service Rep', join_date: '2022-02-01' },
  ],
  recentDepartures: [
    { first_name: 'Nancy', last_name: 'Wanjala', department: 'Printing', position: 'Printer' },
    { first_name: 'Mark', last_name: 'Njenga', department: 'Sales', position: 'Cashier' },
  ],
});

const mockAttrition = () => ({
  overallAttritionRate: 6.5,
  intervals: [
    { period: 'Q1 2024', hired: 3, departed: 1, attritionRate: 3.8 },
    { period: 'Q2 2024', hired: 2, departed: 0, attritionRate: 0 },
    { period: 'Q3 2024', hired: 4, departed: 1, attritionRate: 3.4 },
    { period: 'Q4 2024', hired: 1, departed: 0, attritionRate: 0 },
    { period: 'Q1 2025', hired: 3, departed: 1, attritionRate: 3.3 },
    { period: 'Q2 2025', hired: 2, departed: 0, attritionRate: 0 },
    { period: 'Q3 2025', hired: 1, departed: 1, attritionRate: 3.6 },
    { period: 'Q4 2025', hired: 0, departed: 0, attritionRate: 0 },
  ],
});

const mockCompensation = () => ({
  totalPayroll: 8250000,
  byDepartment: [
    { department: 'CEO', employeeCount: 3, avgSalary: 460000, minSalary: 180000, maxSalary: 850000 },
    { department: 'Admin', employeeCount: 3, avgSalary: 173333, minSalary: 120000, maxSalary: 250000 },
    { department: 'Finance', employeeCount: 4, avgSalary: 322500, minSalary: 160000, maxSalary: 750000 },
    { department: 'Printing', employeeCount: 4, avgSalary: 152500, minSalary: 120000, maxSalary: 300000 },
    { department: 'Purchase', employeeCount: 2, avgSalary: 210000, minSalary: 140000, maxSalary: 280000 },
    { department: 'Sales', employeeCount: 4, avgSalary: 172500, minSalary: 150000, maxSalary: 320000 },
    { department: 'Inventory', employeeCount: 2, avgSalary: 165000, minSalary: 110000, maxSalary: 220000 },
    { department: 'Customer', employeeCount: 2, avgSalary: 145000, minSalary: 90000, maxSalary: 200000 },
    { department: 'Farming', employeeCount: 2, avgSalary: 135000, minSalary: 70000, maxSalary: 200000 },
    { department: 'Pharmacy', employeeCount: 2, avgSalary: 165000, minSalary: 80000, maxSalary: 250000 },
    { department: 'Car Renting', employeeCount: 2, avgSalary: 155000, minSalary: 90000, maxSalary: 220000 },
  ],
  byPosition: [
    { position: 'CEO', employeeCount: 1, avgSalary: 850000 },
    { position: 'Executive Assistant', employeeCount: 1, avgSalary: 180000 },
    { position: 'Strategy Director', employeeCount: 1, avgSalary: 450000 },
    { position: 'Admin Manager', employeeCount: 1, avgSalary: 250000 },
    { position: 'HR Officer', employeeCount: 1, avgSalary: 150000 },
    { position: 'CFO', employeeCount: 1, avgSalary: 750000 },
    { position: 'Accountant', employeeCount: 1, avgSalary: 200000 },
  ],
  salaryByGender: [
    { gender: 'Male', avgSalary: 280000 },
    { gender: 'Female', avgSalary: 185000 },
  ],
});

const mockSuccession = () => ({
  totalPositions: 5,
  filledPositions: 4,
  coverageRate: 80,
  byReadiness: [
    { readiness: 'ready-now', count: 1 },
    { readiness: 'ready-1-year', count: 2 },
    { readiness: 'ready-2-years', count: 1 },
    { readiness: 'development', count: 1 },
  ],
  pipeline: [
    { position: 'CEO', incumbent: 'James Mwangi', successor: 'Peter Kamau', readiness: 'ready-1-year' },
    { position: 'CFO', incumbent: 'Robert Kiplagat', successor: 'Jane Wangui', readiness: 'ready-2-years' },
    { position: 'Production Manager', incumbent: 'John Mutua', successor: 'Esther Nyambura', readiness: 'ready-now' },
  ],
});

const mockDEI = () => ({
  totalEmployees: 31,
  femalePercentage: 45.2,
  malePercentage: 54.8,
  overallGender: [{ gender: 'Male', count: 17 }, { gender: 'Female', count: 14 }],
  byDepartment: [
    { department: 'CEO', male: 2, female: 1, total: 3 },
    { department: 'Admin', male: 1, female: 2, total: 3 },
    { department: 'Finance', male: 2, female: 2, total: 4 },
    { department: 'Printing', male: 2, female: 2, total: 4 },
    { department: 'Purchase', male: 1, female: 1, total: 2 },
    { department: 'Sales', male: 3, female: 1, total: 4 },
    { department: 'Inventory', male: 1, female: 1, total: 2 },
    { department: 'Customer', male: 1, female: 1, total: 2 },
    { department: 'Farming', male: 1, female: 1, total: 2 },
    { department: 'Pharmacy', male: 1, female: 1, total: 2 },
    { department: 'Car Renting', male: 1, female: 1, total: 2 },
  ],
});

const CEOEmployees = () => {
  const [summary, setSummary] = useState(null);
  const [attrition, setAttrition] = useState(null);
  const [compensation, setCompensation] = useState(null);
  const [succession, setSuccession] = useState(null);
  const [dei, setDei] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, a, c, sc, d] = await Promise.allSettled([
          ceoService.getHRSummary(),
          ceoService.getAttritionData('quarter'),
          ceoService.getCompensationData(),
          ceoService.getSuccessionPipeline(),
          ceoService.getDEIMetrics(),
        ]);
        setSummary(s.value?.data?.data || mockSummary());
        setAttrition(a.value?.data?.data || mockAttrition());
        setCompensation(c.value?.data?.data || mockCompensation());
        setSuccession(sc.value?.data?.data || mockSuccession());
        setDei(d.value?.data?.data || mockDEI());
        const failures = [s, a, c, sc, d].filter(r => r.status === 'rejected');
        if (failures.length > 0) setError(`${failures.length} HR API(s) failed, using sample data`);
      } catch (e) {
        setError('Failed to load HR data, using sample data');
        setSummary(mockSummary());
        setAttrition(mockAttrition());
        setCompensation(mockCompensation());
        setSuccession(mockSuccession());
        setDei(mockDEI());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboardContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>HR & People</h1>
        </div>
        <div className={styles.placeholderModule}>
          <div className={styles.placeholderTitle}>Loading HR data...</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'attrition', label: 'Attrition' },
    { id: 'compensation', label: 'Compensation' },
    { id: 'succession', label: 'Succession' },
    { id: 'dei', label: 'DEI' },
  ];

  const attritionData = attrition?.intervals?.map(i => ({
    period: i.period,
    Hired: i.hired,
    Departed: i.departed,
    rate: i.attritionRate,
  })) || [];

  const pieData = dei?.overallGender?.map(g => ({ name: g.gender, value: g.count })) || [];

  const readinessColors = { 'ready-now': '#10B981', 'ready-1-year': '#3B82F6', 'ready-2-years': '#F59E0B', 'development': '#8B5CF6' };

  const readinessData = succession?.byReadiness?.map(r => ({
    name: r.readiness.replace(/-/g, ' '),
    value: r.count,
    fill: readinessColors[r.readiness] || '#6B7280',
  })) || [];

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>HR & People</h1>
        <p className={styles.pageSubtitle}>Workforce analytics, attrition, compensation, succession, and DEI metrics</p>
        {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: activeTab === tab.id ? '#1e3a5f' : 'white', color: activeTab === tab.id ? 'white' : '#475569' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <>
          <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Employees</div>
              <div className={styles.statValue}>{formatNumber(summary?.totalEmployees)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Active</div>
              <div className={styles.statValue} style={{ color: '#059669' }}>{formatNumber(summary?.activeEmployees)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Inactive</div>
              <div className={styles.statValue} style={{ color: '#dc2626' }}>{formatNumber(summary?.inactiveEmployees)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Hired (YTD)</div>
              <div className={styles.statValue} style={{ color: '#2563eb' }}>{formatNumber(summary?.hiredThisYear)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Departed (YTD)</div>
              <div className={styles.statValue} style={{ color: '#dc2626' }}>{formatNumber(summary?.departedThisYear)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Payroll</div>
              <div className={styles.statValue}>{formatCurrency(summary?.totalPayrollPaid)}</div>
            </div>
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Workforce by Department</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Department</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Count</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Avg Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.byDepartment?.map((d, i) => (
                      <tr key={d.department} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{d.department}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(d.count)}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatCurrency(d.avgSalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Gender Diversity</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.875rem' }}>
                {dei?.overallGender?.map((g, idx) => (
                  <div key={g.gender} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length], display: 'inline-block' }} />
                    <span>{g.gender}: {formatNumber(g.count)} ({dei?.femalePercentage && g.gender === 'Female' ? formatPercentage(dei.femalePercentage) : dei?.malePercentage && g.gender === 'Male' ? formatPercentage(dei.malePercentage) : ''})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'attrition' && (
        <div className={styles.ceoCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Attrition Trends</h3>
            <div style={{ background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              Overall Rate: <strong style={{ color: (attrition?.overallAttritionRate || 0) > 10 ? '#dc2626' : '#059669' }}>{formatPercentage(attrition?.overallAttritionRate)}</strong>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={attritionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Hired" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Departed" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'compensation' && (
        <div className={styles.ceoCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>Compensation by Department</h3>
            <div style={{ background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              Total Payroll: <strong>{formatCurrency(compensation?.totalPayroll)}</strong>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Department</th>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Employees</th>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Min Salary</th>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Avg Salary</th>
                  <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Max Salary</th>
                </tr>
              </thead>
              <tbody>
                {compensation?.byDepartment?.map((d, i) => (
                  <tr key={d.department} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{d.department}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(d.employeeCount)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatCurrency(d.minSalary)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}><strong>{formatCurrency(d.avgSalary)}</strong></td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatCurrency(d.maxSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'succession' && (
        <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Succession Pipeline</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className={styles.statCard} style={{ flex: 1 }}>
                <div className={styles.statLabel}>Positions</div>
                <div className={styles.statValue}>{formatNumber(succession?.totalPositions)}</div>
              </div>
              <div className={styles.statCard} style={{ flex: 1 }}>
                <div className={styles.statLabel}>Coverage</div>
                <div className={styles.statValue} style={{ color: (succession?.coverageRate || 0) >= 80 ? '#059669' : '#F59E0B' }}>{formatPercentage(succession?.coverageRate)}</div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Position</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Incumbent</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Successor</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {succession?.pipeline?.map((p, i) => (
                    <tr key={p.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{p.position}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{p.incumbent || 'Vacant'}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{p.successor || 'Not identified'}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: p.readiness === 'ready-now' ? '#dcfce7' : p.readiness === 'ready-1-year' ? '#dbeafe' : p.readiness === 'ready-2-years' ? '#fef3c7' : '#f3e8ff', color: p.readiness === 'ready-now' ? '#166534' : p.readiness === 'ready-1-year' ? '#1e40af' : p.readiness === 'ready-2-years' ? '#92400e' : '#6b21a8' }}>
                          {p.readiness?.replace(/-/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Readiness Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={readinessData} cx="50%" cy="50%" outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {readinessData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dei' && (
        <>
          <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Female Representation</div>
              <div className={styles.statValue} style={{ color: '#8B5CF6' }}>{formatPercentage(dei?.femalePercentage)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Male Representation</div>
              <div className={styles.statValue} style={{ color: '#3B82F6' }}>{formatPercentage(dei?.malePercentage)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Departments</div>
              <div className={styles.statValue}>{formatNumber(dei?.byDepartment?.length)}</div>
            </div>
          </div>

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Gender Diversity by Department</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Department</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Male</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Female</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {dei?.byDepartment?.map((d, i) => (
                    <tr key={d.department} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{d.department}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(d.male || 0)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(d.female || 0)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(d.total)}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${d.total > 0 ? ((d.male || 0) / d.total) * 100 : 0}%`, background: '#3B82F6', height: '100%' }} />
                            <div style={{ width: `${d.total > 0 ? ((d.female || 0) / d.total) * 100 : 0}%`, background: '#8B5CF6', height: '100%' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {d.total > 0 ? `${Math.round(((d.male || 0) / d.total) * 100)}/${Math.round(((d.female || 0) / d.total) * 100)}` : '0/0'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CEOEmployees;
