import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import ceoService from '../../services/ceoService';
import { formatNumber } from '../../utils/formatters';
import styles from './CEODashboard.module.css';

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#6B7280', '#EC4899', '#14B8A6'];

const mockRisk = () => ({
  totalRisks: 8, criticalRisks: 4, averageScore: 11.1,
  byCategory: [{ category: 'Compliance', count: 1 }, { category: 'Cybersecurity', count: 1 }, { category: 'Financial', count: 1 }, { category: 'HR', count: 1 }, { category: 'Operational', count: 2 }, { category: 'Strategic', count: 1 }, { category: 'Technology', count: 1 }],
  byStatus: [{ status: 'assessed', count: 2 }, { status: 'identified', count: 1 }, { status: 'mitigated', count: 3 }, { status: 'monitored', count: 2 }],
  risks: [
    { title: 'Supply Chain Disruption', category: 'Operational', likelihood: 'likely', impact: 'major', risk_score: 16, status: 'mitigated', owner: 'Joseph Kiprop' },
    { title: 'IT System Downtime', category: 'Technology', likelihood: 'possible', impact: 'severe', risk_score: 15, status: 'monitored', owner: 'Sarah Akinyi' },
    { title: 'Currency Fluctuation', category: 'Financial', likelihood: 'likely', impact: 'moderate', risk_score: 12, status: 'monitored', owner: 'Robert Kiplagat' },
    { title: 'Key Person Dependency', category: 'HR', likelihood: 'possible', impact: 'major', risk_score: 12, status: 'assessed', owner: 'Mary Njoki' },
    { title: 'Regulatory Non-Compliance', category: 'Compliance', likelihood: 'unlikely', impact: 'major', risk_score: 10, status: 'assessed', owner: 'David Ochieng' },
    { title: 'Data Breach', category: 'Cybersecurity', likelihood: 'unlikely', impact: 'severe', risk_score: 10, status: 'mitigated', owner: 'Sarah Akinyi' },
    { title: 'Customer Concentration', category: 'Strategic', likelihood: 'possible', impact: 'moderate', risk_score: 8, status: 'identified', owner: 'Michael Njoroge' },
    { title: 'Fire / Physical Disaster', category: 'Operational', likelihood: 'rare', impact: 'severe', risk_score: 6, status: 'mitigated', owner: 'John Mutua' },
  ],
});

const mockCompliance = () => ({
  totalItems: 8, compliantItems: 4, nonCompliantItems: 1, complianceRate: 50,
  byStatus: [{ status: 'compliant', count: 4 }, { status: 'in-progress', count: 3 }, { status: 'non-compliant', count: 1 }],
  items: [
    { requirement: 'Tax Filing', regulation: 'Tax Proclamation', status: 'compliant', last_review_date: '2025-03-15', next_review_date: '2025-06-30', responsible_owner: 'Robert Kiplagat' },
    { requirement: 'Data Protection', regulation: 'Data Protection', status: 'in-progress', last_review_date: '2025-02-01', next_review_date: '2025-08-01', responsible_owner: 'Sarah Akinyi' },
    { requirement: 'Employment Equity', regulation: 'Labor', status: 'non-compliant', last_review_date: '2024-12-01', next_review_date: '2025-06-01', responsible_owner: 'David Ochieng' },
  ],
});

const mockCalendar = () => ({
  totalItems: 8, upcomingItems: 5, dueSoonItems: 1, overdueItems: 1, completedItems: 1,
  items: [
    { title: 'Annual Corp Tax Return', authority: 'Ministry of Revenue', deadline: '2025-06-30', status: 'due-soon', owner: 'Robert Kiplagat' },
    { title: 'Employment Equity Report', authority: 'Ministry of Labor', deadline: '2025-06-15', status: 'overdue', owner: 'David Ochieng' },
    { title: 'Data Protection Audit', authority: 'Data Protection', deadline: '2025-08-15', status: 'upcoming', owner: 'Sarah Akinyi' },
  ],
});

const mockESG = () => ({
  metrics: [
    { category: 'Environmental', metric_name: 'Paper Recycling Rate', current_value: 62, target_value: 80, unit: '%', trend: 'improving' },
    { category: 'Environmental', metric_name: 'Energy Consumption', current_value: 45200, target_value: 40000, unit: 'kWh', trend: 'declining' },
    { category: 'Social', metric_name: 'Training Hours', current_value: 240, target_value: 500, unit: 'hours', trend: 'improving' },
    { category: 'Social', metric_name: 'Gender Diversity', current_value: 45, target_value: 50, unit: '%', trend: 'improving' },
    { category: 'Governance', metric_name: 'Board Attendance', current_value: 95, target_value: 100, unit: '%', trend: 'stable' },
    { category: 'Governance', metric_name: 'Compliance Rate', current_value: 88, target_value: 95, unit: '%', trend: 'improving' },
  ],
  byCategory: [{ category: 'Environmental', count: 4 }, { category: 'Social', count: 4 }, { category: 'Governance', count: 4 }],
});

const mockCyber = () => ({
  totalControls: 10, implementedControls: 5, inProgressControls: 3, notStartedControls: 2, overallScore: 61,
  byCategory: [{ category: 'Access Control', averageScore: 90, count: 1 }, { category: 'Data Security', averageScore: 60, count: 1 }, { category: 'Governance', averageScore: 43, count: 3 }, { category: 'Infrastructure', averageScore: 82, count: 3 }, { category: 'Network Security', averageScore: 40, count: 2 }],
  controls: [
    { control_name: 'MFA', category: 'Access Control', status: 'implemented', score: 90 },
    { control_name: 'Endpoint Protection', category: 'Infrastructure', status: 'implemented', score: 85 },
    { control_name: 'Data Encryption', category: 'Data Security', status: 'in-progress', score: 60 },
    { control_name: 'Patch Management', category: 'Infrastructure', status: 'in-progress', score: 65 },
  ],
});

const statusBadge = (status) => {
  const map = {
    mitigated: { bg: '#dbeafe', color: '#1e40af' }, monitored: { bg: '#fef3c7', color: '#92400e' }, assessed: { bg: '#f3e8ff', color: '#6b21a8' }, identified: { bg: '#fee2e2', color: '#991b1b' }, closed: { bg: '#dcfce7', color: '#166534' },
    compliant: { bg: '#dcfce7', color: '#166534' }, 'non-compliant': { bg: '#fee2e2', color: '#991b1b' }, 'in-progress': { bg: '#fef3c7', color: '#92400e' }, 'not-applicable': { bg: '#f1f5f9', color: '#475569' },
    upcoming: { bg: '#dbeafe', color: '#1e40af' }, 'due-soon': { bg: '#fef3c7', color: '#92400e' }, overdue: { bg: '#fee2e2', color: '#991b1b' }, completed: { bg: '#dcfce7', color: '#166534' },
    implemented: { bg: '#dcfce7', color: '#166534' }, 'not-started': { bg: '#fee2e2', color: '#991b1b' },
    improving: { bg: '#dcfce7', color: '#166534' }, stable: { bg: '#dbeafe', color: '#1e40af' }, declining: { bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>{status}</span>;
};

const riskLevel = (score) => {
  if (score >= 15) return { label: 'Critical', color: '#dc2626' };
  if (score >= 10) return { label: 'High', color: '#f59e0b' };
  if (score >= 5) return { label: 'Medium', color: '#3b82f6' };
  return { label: 'Low', color: '#10b981' };
};

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: 'white', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' };
const actionBtn = { padding: '0.25rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 };

const CEORisk = () => {
  const [risk, setRisk] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [esg, setEsg] = useState(null);
  const [cyber, setCyber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('risk-register');
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(null);
  const [formData, setFormData] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [r, c, cal, e, cy] = await Promise.allSettled([
          ceoService.getRiskRegister(),
          ceoService.getComplianceStatus(),
          ceoService.getRegulatoryCalendar(),
          ceoService.getESGSummary(),
          ceoService.getCybersecurityPosture(),
        ]);
        setRisk(r.value?.data?.data || mockRisk());
        setCompliance(c.value?.data?.data || mockCompliance());
        setCalendar(cal.value?.data?.data || mockCalendar());
        setEsg(e.value?.data?.data || mockESG());
        setCyber(cy.value?.data?.data || mockCyber());
        const failures = [r, c, cal, e, cy].filter(r => r.status === 'rejected');
        if (failures.length > 0) setError(`${failures.length} Risk API(s) failed, using sample data`);
      } catch (e) {
        setError('Failed to load risk data, using sample data');
        setRisk(mockRisk()); setCompliance(mockCompliance()); setCalendar(mockCalendar()); setEsg(mockESG()); setCyber(mockCyber());
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fetchAll = async () => {
    try {
      const [r, c, cal, e, cy] = await Promise.allSettled([
        ceoService.getRiskRegister(),
        ceoService.getComplianceStatus(),
        ceoService.getRegulatoryCalendar(),
        ceoService.getESGSummary(),
        ceoService.getCybersecurityPosture(),
      ]);
      setRisk(r.value?.data?.data || mockRisk());
      setCompliance(c.value?.data?.data || mockCompliance());
      setCalendar(cal.value?.data?.data || mockCalendar());
      setEsg(e.value?.data?.data || mockESG());
      setCyber(cy.value?.data?.data || mockCyber());
    } catch (_) {}
  };

  const handleCreate = async (type, apiCall) => {
    setSubmitting(true);
    try {
      await apiCall(formData);
      setFormData({});
      setShowCreate(null);
      await fetchAll();
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editItem || !editType) return;
    setSubmitting(true);
    try {
      const apiMap = {
        risk: ceoService.updateRisk,
        compliance: ceoService.updateComplianceItem,
        regulatory: ceoService.updateRegulatoryItem,
        esg: ceoService.updateESGMetric,
        cyber: ceoService.updateCyberControl,
      };
      await apiMap[editType](editItem.id, editFormData);
      setEditItem(null);
      setEditType(null);
      setEditFormData({});
      await fetchAll();
    } catch (e) {
      alert('Failed to update: ' + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      const apiMap = {
        risk: ceoService.deleteRisk,
        compliance: ceoService.deleteComplianceItem,
        regulatory: ceoService.deleteRegulatoryItem,
        esg: ceoService.deleteESGMetric,
        cyber: ceoService.deleteCyberControl,
      };
      await apiMap[deleteConfirm.type](deleteConfirm.id);
      setDeleteConfirm(null);
      await fetchAll();
    } catch (e) {
      alert('Failed to delete: ' + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className={styles.dashboardContent}>
      <div className={styles.pageHeader}><h1 className={styles.pageTitle}>Risk & Compliance</h1></div>
      <div className={styles.placeholderModule}><div className={styles.placeholderTitle}>Loading risk data...</div></div>
    </div>
  );

  const tabs = [
    { id: 'risk-register', label: 'Risk Register' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'regulatory', label: 'Regulatory' },
    { id: 'esg', label: 'ESG' },
    { id: 'cybersecurity', label: 'Cybersecurity' },
  ];

  const riskHeatData = risk?.risks?.map(r => ({ name: r.title.substring(0, 20) + '...', score: r.risk_score, fill: r.risk_score >= 15 ? '#EF4444' : r.risk_score >= 10 ? '#F59E0B' : r.risk_score >= 5 ? '#3B82F6' : '#10B981' })) || [];
  const catData = risk?.byCategory?.map(c => ({ name: c.category, value: c.count })) || [];
  const statusData = risk?.byStatus?.map(s => ({ name: s.status, value: s.count })) || [];
  const compStatusData = compliance?.byStatus?.map(s => ({ name: s.status, value: s.count, fill: s.status === 'compliant' ? '#10B981' : s.status === 'non-compliant' ? '#EF4444' : '#F59E0B' })) || [];
  const esgChart = esg?.metrics?.map(m => ({ name: m.metric_name.substring(0, 15), current: parseFloat(m.current_value), target: parseFloat(m.target_value) })) || [];
  const cyberRadar = cyber?.byCategory?.map(c => ({ category: c.category.substring(0, 12), score: c.averageScore })) || [];

  const renderCreateBtn = (type, label) => (
    <button onClick={() => setShowCreate(type)}
      style={{ marginLeft: '1rem', padding: '0.625rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      + {label}
    </button>
  );

  const renderActionBtns = (type, item) => (
    <>
      <button style={actionBtn} onClick={() => { setEditItem(item); setEditType(type); setEditFormData(item); }}>Edit</button>
      <button style={{ ...actionBtn, marginLeft: '0.375rem', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteConfirm({ type, id: item.id, title: item.title || item.requirement || item.control_name || item.metric_name })}>Delete</button>
    </>
  );

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Risk & Compliance</h1>
        <p className={styles.pageSubtitle}>Risk register, ESG summary, regulatory calendar, compliance status, and cybersecurity posture</p>
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

      {activeTab === 'risk-register' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}><div className={styles.statLabel}>Total Risks</div><div className={styles.statValue}>{formatNumber(risk?.totalRisks)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Critical (score 15+)</div><div className={styles.statValue} style={{ color: '#dc2626' }}>{formatNumber(risk?.criticalRisks)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Average Score</div><div className={styles.statValue}>{risk?.averageScore}</div></div>
            </div>
            {renderCreateBtn('risk', 'Register Risk')}
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Risk Heat Map</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={riskHeatData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 25]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [value, 'Score']} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {riskHeatData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>By Category & Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Category</div>
                  {catData.map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#475569' }}>{c.name}</span>
                      <span style={{ fontWeight: 600 }}>{c.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Status</div>
                  {statusData.map((s, i) => (
                    <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#475569' }}>{s.name}</span>
                      <span style={{ fontWeight: 600 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Risk Register</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Risk</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Score</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Level</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Owner</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {risk?.risks?.map((r, i) => {
                    const lvl = riskLevel(r.risk_score);
                    return (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{r.title}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{r.category}</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{r.risk_score}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ color: lvl.color, fontWeight: 600 }}>{lvl.label}</span></td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(r.status)}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{r.owner}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{renderActionBtns('risk', r)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'compliance' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}><div className={styles.statLabel}>Total Requirements</div><div className={styles.statValue}>{formatNumber(compliance?.totalItems)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Compliant</div><div className={styles.statValue} style={{ color: '#059669' }}>{formatNumber(compliance?.compliantItems)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Non-Compliant</div><div className={styles.statValue} style={{ color: '#dc2626' }}>{formatNumber(compliance?.nonCompliantItems)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Compliance Rate</div><div className={styles.statValue} style={{ color: (compliance?.complianceRate || 0) >= 80 ? '#059669' : '#F59E0B' }}>{compliance?.complianceRate}%</div></div>
            </div>
            {renderCreateBtn('compliance', 'Add Requirement')}
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Compliance Overview</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={compStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {compStatusData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Compliance Status by Requirement</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Requirement</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Regulation</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Owner</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compliance?.items?.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{c.requirement}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{c.regulation}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{c.responsible_owner}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(c.status)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{renderActionBtns('compliance', c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'regulatory' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}><div className={styles.statLabel}>Total Items</div><div className={styles.statValue}>{formatNumber(calendar?.totalItems)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Overdue</div><div className={styles.statValue} style={{ color: '#dc2626' }}>{formatNumber(calendar?.overdueItems)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Due Soon</div><div className={styles.statValue} style={{ color: '#F59E0B' }}>{formatNumber(calendar?.dueSoonItems)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Completed</div><div className={styles.statValue} style={{ color: '#059669' }}>{formatNumber(calendar?.completedItems)}</div></div>
            </div>
            {renderCreateBtn('regulatory', 'Add Deadline')}
          </div>

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Regulatory Calendar</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Requirement</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Authority</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Deadline</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Owner</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar?.items?.map((c, i) => (
                    <tr key={c.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{c.title}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{c.authority}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: c.status === 'overdue' || c.status === 'due-soon' ? 600 : 400, color: c.status === 'overdue' ? '#dc2626' : c.status === 'due-soon' ? '#d97706' : '#0f172a' }}>
                        {new Date(c.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{c.owner}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(c.status)}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{renderActionBtns('regulatory', c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'esg' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              {esg?.byCategory?.map(c => (
                <div key={c.category} className={styles.statCard}>
                  <div className={styles.statLabel}>{c.category}</div>
                  <div className={styles.statValue}>{formatNumber(c.count)} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748b' }}>metrics</span></div>
                </div>
              ))}
            </div>
            {renderCreateBtn('esg', 'Add Metric')}
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Current vs Target</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={esgChart} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Current" />
                  <Bar dataKey="target" fill="#10B981" radius={[4, 4, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>ESG Metrics</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Metric</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Current</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Target</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Trend</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {esg?.metrics?.map((m, i) => (
                      <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}><span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '0.375rem' }}>{m.category}</span>{m.metric_name}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(m.current_value)} {m.unit}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(m.target_value)} {m.unit}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(m.trend)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{renderActionBtns('esg', m)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'cybersecurity' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}><div className={styles.statLabel}>Security Score</div><div className={styles.statValue} style={{ color: (cyber?.overallScore || 0) >= 80 ? '#059669' : (cyber?.overallScore || 0) >= 50 ? '#F59E0B' : '#dc2626' }}>{cyber?.overallScore}%</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Controls</div><div className={styles.statValue}>{formatNumber(cyber?.totalControls)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Implemented</div><div className={styles.statValue} style={{ color: '#059669' }}>{formatNumber(cyber?.implementedControls)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Not Started</div><div className={styles.statValue} style={{ color: '#dc2626' }}>{formatNumber(cyber?.notStartedControls)}</div></div>
            </div>
            {renderCreateBtn('cyber', 'Add Control')}
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Security Posture by Category</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={cyberRadar} cx="50%" cy="50%" outerRadius={100}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Security Controls</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Control</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Score</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cyber?.controls?.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{c.control_name}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{c.category}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: (c.score || 0) >= 80 ? '#059669' : (c.score || 0) >= 50 ? '#F59E0B' : '#dc2626' }}>{c.score || 0}%</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(c.status)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{renderActionBtns('cyber', c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Risk Modal */}
      {showCreate === 'risk' && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowCreate(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Register New Risk</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Risk Title *</label><input style={inputStyle} value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Supply Chain Disruption" /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Category</label><input style={inputStyle} value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Operational" /></div>
                <div><label style={labelStyle}>Owner</label><input style={inputStyle} value={formData.owner || ''} onChange={e => setFormData({...formData, owner: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Likelihood</label><select style={inputStyle} value={formData.likelihood || 'possible'} onChange={e => setFormData({...formData, likelihood: e.target.value})}>
                  <option value="rare">Rare</option><option value="unlikely">Unlikely</option><option value="possible">Possible</option><option value="likely">Likely</option><option value="almost-certain">Almost Certain</option>
                </select></div>
                <div><label style={labelStyle}>Impact</label><select style={inputStyle} value={formData.impact || 'moderate'} onChange={e => setFormData({...formData, impact: e.target.value})}>
                  <option value="negligible">Negligible</option><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="major">Major</option><option value="severe">Severe</option>
                </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Risk Score</label><input style={inputStyle} type="number" value={formData.risk_score || ''} onChange={e => setFormData({...formData, risk_score: e.target.value})} /></div>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={formData.status || 'identified'} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="identified">Identified</option><option value="assessed">Assessed</option><option value="mitigated">Mitigated</option><option value="monitored">Monitored</option><option value="closed">Closed</option>
                </select></div>
              </div>
              <div><label style={labelStyle}>Mitigation Strategy</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={formData.mitigation_strategy || ''} onChange={e => setFormData({...formData, mitigation_strategy: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowCreate(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleCreate('risk', ceoService.createRisk(formData))} disabled={submitting || !formData.title} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.title ? 'not-allowed' : 'pointer', opacity: submitting || !formData.title ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Register Risk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Compliance Modal */}
      {showCreate === 'compliance' && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowCreate(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Add Compliance Requirement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Requirement *</label><input style={inputStyle} value={formData.requirement || ''} onChange={e => setFormData({...formData, requirement: e.target.value})} placeholder="e.g. Data Protection Compliance" /></div>
              <div><label style={labelStyle}>Regulation</label><input style={inputStyle} value={formData.regulation || ''} onChange={e => setFormData({...formData, regulation: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={formData.status || 'in-progress'} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="compliant">Compliant</option><option value="in-progress">In Progress</option><option value="non-compliant">Non-Compliant</option><option value="not-applicable">N/A</option>
                </select></div>
                <div><label style={labelStyle}>Responsible Owner</label><input style={inputStyle} value={formData.responsible_owner || ''} onChange={e => setFormData({...formData, responsible_owner: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Last Review</label><input style={inputStyle} type="date" value={formData.last_review_date || ''} onChange={e => setFormData({...formData, last_review_date: e.target.value})} /></div>
                <div><label style={labelStyle}>Next Review</label><input style={inputStyle} type="date" value={formData.next_review_date || ''} onChange={e => setFormData({...formData, next_review_date: e.target.value})} /></div>
              </div>
              <div><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowCreate(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleCreate('compliance', ceoService.createComplianceItem(formData))} disabled={submitting || !formData.requirement} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.requirement ? 'not-allowed' : 'pointer', opacity: submitting || !formData.requirement ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Add Requirement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Regulatory Modal */}
      {showCreate === 'regulatory' && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowCreate(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Add Regulatory Deadline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Annual Tax Return" /></div>
              <div><label style={labelStyle}>Authority</label><input style={inputStyle} value={formData.authority || ''} onChange={e => setFormData({...formData, authority: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Deadline *</label><input style={inputStyle} type="date" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} /></div>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={formData.status || 'upcoming'} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="upcoming">Upcoming</option><option value="due-soon">Due Soon</option><option value="overdue">Overdue</option><option value="completed">Completed</option>
                </select></div>
              </div>
              <div><label style={labelStyle}>Owner</label><input style={inputStyle} value={formData.owner || ''} onChange={e => setFormData({...formData, owner: e.target.value})} /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowCreate(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleCreate('regulatory', ceoService.createRegulatoryItem(formData))} disabled={submitting || !formData.title || !formData.deadline} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.title || !formData.deadline ? 'not-allowed' : 'pointer', opacity: submitting || !formData.title || !formData.deadline ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Add Deadline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create ESG Modal */}
      {showCreate === 'esg' && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowCreate(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Add ESG Metric</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Category *</label><select style={inputStyle} value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="">Select...</option><option value="Environmental">Environmental</option><option value="Social">Social</option><option value="Governance">Governance</option>
              </select></div>
              <div><label style={labelStyle}>Metric Name *</label><input style={inputStyle} value={formData.metric_name || ''} onChange={e => setFormData({...formData, metric_name: e.target.value})} placeholder="e.g. Paper Recycling Rate" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Current Value</label><input style={inputStyle} type="number" step="0.01" value={formData.current_value || ''} onChange={e => setFormData({...formData, current_value: e.target.value})} /></div>
                <div><label style={labelStyle}>Target Value</label><input style={inputStyle} type="number" step="0.01" value={formData.target_value || ''} onChange={e => setFormData({...formData, target_value: e.target.value})} /></div>
                <div><label style={labelStyle}>Unit</label><input style={inputStyle} value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="%" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Period</label><input style={inputStyle} value={formData.period || ''} onChange={e => setFormData({...formData, period: e.target.value})} placeholder="e.g. 2025-Q2" /></div>
                <div><label style={labelStyle}>Trend</label><select style={inputStyle} value={formData.trend || 'stable'} onChange={e => setFormData({...formData, trend: e.target.value})}>
                  <option value="improving">Improving</option><option value="stable">Stable</option><option value="declining">Declining</option>
                </select></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowCreate(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleCreate('esg', ceoService.createESGMetric(formData))} disabled={submitting || !formData.category || !formData.metric_name} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.category || !formData.metric_name ? 'not-allowed' : 'pointer', opacity: submitting || !formData.category || !formData.metric_name ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Add Metric'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Cyber Modal */}
      {showCreate === 'cyber' && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowCreate(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Add Cybersecurity Control</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Control Name *</label><input style={inputStyle} value={formData.control_name || ''} onChange={e => setFormData({...formData, control_name: e.target.value})} placeholder="e.g. Multi-Factor Authentication" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Category</label><input style={inputStyle} value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Access Control" /></div>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={formData.status || 'not-started'} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="not-started">Not Started</option><option value="in-progress">In Progress</option><option value="implemented">Implemented</option><option value="not-applicable">N/A</option>
                </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Score (0-100)</label><input style={inputStyle} type="number" min="0" max="100" value={formData.score || ''} onChange={e => setFormData({...formData, score: e.target.value})} /></div>
                <div><label style={labelStyle}>Last Assessment</label><input style={inputStyle} type="date" value={formData.last_assessment_date || ''} onChange={e => setFormData({...formData, last_assessment_date: e.target.value})} /></div>
              </div>
              <div><label style={labelStyle}>Next Review</label><input style={inputStyle} type="date" value={formData.next_review_date || ''} onChange={e => setFormData({...formData, next_review_date: e.target.value})} /></div>
              <div><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowCreate(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleCreate('cyber', ceoService.createCyberControl(formData))} disabled={submitting || !formData.control_name} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.control_name ? 'not-allowed' : 'pointer', opacity: submitting || !formData.control_name ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Add Control'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Risk Modal */}
      {editType === 'risk' && editItem && (
        <div style={modalOverlay} onClick={() => { if (!submitting) { setEditItem(null); setEditType(null); } }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Risk</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Risk Title *</label><input style={inputStyle} value={editFormData.title || ''} onChange={e => setEditFormData({...editFormData, title: e.target.value})} /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Category</label><input style={inputStyle} value={editFormData.category || ''} onChange={e => setEditFormData({...editFormData, category: e.target.value})} /></div>
                <div><label style={labelStyle}>Owner</label><input style={inputStyle} value={editFormData.owner || ''} onChange={e => setEditFormData({...editFormData, owner: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Likelihood</label><select style={inputStyle} value={editFormData.likelihood || 'possible'} onChange={e => setEditFormData({...editFormData, likelihood: e.target.value})}>
                  <option value="rare">Rare</option><option value="unlikely">Unlikely</option><option value="possible">Possible</option><option value="likely">Likely</option><option value="almost-certain">Almost Certain</option>
                </select></div>
                <div><label style={labelStyle}>Impact</label><select style={inputStyle} value={editFormData.impact || 'moderate'} onChange={e => setEditFormData({...editFormData, impact: e.target.value})}>
                  <option value="negligible">Negligible</option><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="major">Major</option><option value="severe">Severe</option>
                </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Risk Score</label><input style={inputStyle} type="number" value={editFormData.risk_score || ''} onChange={e => setEditFormData({...editFormData, risk_score: e.target.value})} /></div>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={editFormData.status || 'identified'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="identified">Identified</option><option value="assessed">Assessed</option><option value="mitigated">Mitigated</option><option value="monitored">Monitored</option><option value="closed">Closed</option>
                </select></div>
              </div>
              <div><label style={labelStyle}>Mitigation Strategy</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.mitigation_strategy || ''} onChange={e => setEditFormData({...editFormData, mitigation_strategy: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => { setEditItem(null); setEditType(null); }} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleEdit} disabled={submitting || !editFormData.title} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.title ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.title ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Compliance Modal */}
      {editType === 'compliance' && editItem && (
        <div style={modalOverlay} onClick={() => { if (!submitting) { setEditItem(null); setEditType(null); } }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Compliance Requirement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Requirement *</label><input style={inputStyle} value={editFormData.requirement || ''} onChange={e => setEditFormData({...editFormData, requirement: e.target.value})} /></div>
              <div><label style={labelStyle}>Regulation</label><input style={inputStyle} value={editFormData.regulation || ''} onChange={e => setEditFormData({...editFormData, regulation: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={editFormData.status || 'in-progress'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="compliant">Compliant</option><option value="in-progress">In Progress</option><option value="non-compliant">Non-Compliant</option><option value="not-applicable">N/A</option>
                </select></div>
                <div><label style={labelStyle}>Responsible Owner</label><input style={inputStyle} value={editFormData.responsible_owner || ''} onChange={e => setEditFormData({...editFormData, responsible_owner: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Last Review</label><input style={inputStyle} type="date" value={editFormData.last_review_date || ''} onChange={e => setEditFormData({...editFormData, last_review_date: e.target.value})} /></div>
                <div><label style={labelStyle}>Next Review</label><input style={inputStyle} type="date" value={editFormData.next_review_date || ''} onChange={e => setEditFormData({...editFormData, next_review_date: e.target.value})} /></div>
              </div>
              <div><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.notes || ''} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => { setEditItem(null); setEditType(null); }} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleEdit} disabled={submitting || !editFormData.requirement} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.requirement ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.requirement ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Regulatory Modal */}
      {editType === 'regulatory' && editItem && (
        <div style={modalOverlay} onClick={() => { if (!submitting) { setEditItem(null); setEditType(null); } }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Regulatory Deadline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={editFormData.title || ''} onChange={e => setEditFormData({...editFormData, title: e.target.value})} /></div>
              <div><label style={labelStyle}>Authority</label><input style={inputStyle} value={editFormData.authority || ''} onChange={e => setEditFormData({...editFormData, authority: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Deadline *</label><input style={inputStyle} type="date" value={editFormData.deadline || ''} onChange={e => setEditFormData({...editFormData, deadline: e.target.value})} /></div>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={editFormData.status || 'upcoming'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="upcoming">Upcoming</option><option value="due-soon">Due Soon</option><option value="overdue">Overdue</option><option value="completed">Completed</option>
                </select></div>
              </div>
              <div><label style={labelStyle}>Owner</label><input style={inputStyle} value={editFormData.owner || ''} onChange={e => setEditFormData({...editFormData, owner: e.target.value})} /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => { setEditItem(null); setEditType(null); }} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleEdit} disabled={submitting || !editFormData.title || !editFormData.deadline} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.title || !editFormData.deadline ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.title || !editFormData.deadline ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit ESG Modal */}
      {editType === 'esg' && editItem && (
        <div style={modalOverlay} onClick={() => { if (!submitting) { setEditItem(null); setEditType(null); } }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit ESG Metric</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Category *</label><select style={inputStyle} value={editFormData.category || ''} onChange={e => setEditFormData({...editFormData, category: e.target.value})}>
                <option value="">Select...</option><option value="Environmental">Environmental</option><option value="Social">Social</option><option value="Governance">Governance</option>
              </select></div>
              <div><label style={labelStyle}>Metric Name *</label><input style={inputStyle} value={editFormData.metric_name || ''} onChange={e => setEditFormData({...editFormData, metric_name: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Current Value</label><input style={inputStyle} type="number" step="0.01" value={editFormData.current_value || ''} onChange={e => setEditFormData({...editFormData, current_value: e.target.value})} /></div>
                <div><label style={labelStyle}>Target Value</label><input style={inputStyle} type="number" step="0.01" value={editFormData.target_value || ''} onChange={e => setEditFormData({...editFormData, target_value: e.target.value})} /></div>
                <div><label style={labelStyle}>Unit</label><input style={inputStyle} value={editFormData.unit || ''} onChange={e => setEditFormData({...editFormData, unit: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Period</label><input style={inputStyle} value={editFormData.period || ''} onChange={e => setEditFormData({...editFormData, period: e.target.value})} /></div>
                <div><label style={labelStyle}>Trend</label><select style={inputStyle} value={editFormData.trend || 'stable'} onChange={e => setEditFormData({...editFormData, trend: e.target.value})}>
                  <option value="improving">Improving</option><option value="stable">Stable</option><option value="declining">Declining</option>
                </select></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => { setEditItem(null); setEditType(null); }} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleEdit} disabled={submitting || !editFormData.category || !editFormData.metric_name} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.category || !editFormData.metric_name ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.category || !editFormData.metric_name ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cyber Modal */}
      {editType === 'cyber' && editItem && (
        <div style={modalOverlay} onClick={() => { if (!submitting) { setEditItem(null); setEditType(null); } }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Cybersecurity Control</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Control Name *</label><input style={inputStyle} value={editFormData.control_name || ''} onChange={e => setEditFormData({...editFormData, control_name: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Category</label><input style={inputStyle} value={editFormData.category || ''} onChange={e => setEditFormData({...editFormData, category: e.target.value})} /></div>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={editFormData.status || 'not-started'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="not-started">Not Started</option><option value="in-progress">In Progress</option><option value="implemented">Implemented</option><option value="not-applicable">N/A</option>
                </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Score (0-100)</label><input style={inputStyle} type="number" min="0" max="100" value={editFormData.score || ''} onChange={e => setEditFormData({...editFormData, score: e.target.value})} /></div>
                <div><label style={labelStyle}>Last Assessment</label><input style={inputStyle} type="date" value={editFormData.last_assessment_date || ''} onChange={e => setEditFormData({...editFormData, last_assessment_date: e.target.value})} /></div>
              </div>
              <div><label style={labelStyle}>Next Review</label><input style={inputStyle} type="date" value={editFormData.next_review_date || ''} onChange={e => setEditFormData({...editFormData, next_review_date: e.target.value})} /></div>
              <div><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.notes || ''} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => { setEditItem(null); setEditType(null); }} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleEdit} disabled={submitting || !editFormData.control_name} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.control_name ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.control_name ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setDeleteConfirm(null); }}>
          <div style={{ ...modalBox, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#dc2626' }}>Confirm Delete</h3>
            <p style={{ fontSize: '0.9375rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleDelete} disabled={submitting} style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEORisk;
