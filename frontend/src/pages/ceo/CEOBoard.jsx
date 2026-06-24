import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import styles from './CEODashboard.module.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6'];

const mockMeetings = () => ({
  totalMeetings: 5, completedMeetings: 3, scheduledMeetings: 2,
  upcomingMeetings: [
    { title: 'Q3 2025 Board Meeting', meeting_date: '2025-07-21', status: 'scheduled', venue: 'Executive Boardroom' },
    { title: 'Annual General Meeting 2025', meeting_date: '2025-09-15', status: 'scheduled', venue: 'Main Conference Hall' },
  ],
  meetings: [
    { title: 'Q1 2025 Board Strategy Session', meeting_date: '2025-01-20', status: 'completed', venue: 'Executive Boardroom' },
    { title: 'Q2 2025 Board Meeting', meeting_date: '2025-04-15', status: 'completed', venue: 'Executive Boardroom' },
    { title: 'Emergency Board Session', meeting_date: '2025-06-10', status: 'completed', venue: 'Virtual (Zoom)' },
    { title: 'Q3 2025 Board Meeting', meeting_date: '2025-07-21', status: 'scheduled', venue: 'Executive Boardroom' },
    { title: 'Annual General Meeting 2025', meeting_date: '2025-09-15', status: 'scheduled', venue: 'Main Conference Hall' },
  ],
});

const mockShareholders = () => ({
  totalShareholders: 7, activeShareholders: 6, totalActivePercentage: 98, totalSharesIssued: 100000,
  byType: [{ type: 'founder', count: 2 }, { type: 'ordinary', count: 4 }, { type: 'preferred', count: 1 }],
  shareholders: [
    { name: 'Habtamu Abera', share_percentage: 35, shares_count: 35000, share_type: 'founder', status: 'active' },
    { name: 'Kidist Belay', share_percentage: 25, shares_count: 25000, share_type: 'founder', status: 'active' },
    { name: 'Melat Sisay', share_percentage: 15, shares_count: 15000, share_type: 'ordinary', status: 'active' },
    { name: 'Zemen Equity Partners', share_percentage: 15, shares_count: 15000, share_type: 'preferred', status: 'active' },
    { name: 'Tigist Hailu', share_percentage: 5, shares_count: 5000, share_type: 'ordinary', status: 'active' },
    { name: 'Biruk Assefa', share_percentage: 3, shares_count: 3000, share_type: 'ordinary', status: 'active' },
    { name: 'Meron Tesfaye', share_percentage: 2, shares_count: 2000, share_type: 'ordinary', status: 'inactive' },
  ],
});

const mockDividends = () => ({
  totalDeclared: 19160000, totalPaid: 13760000, pendingPayout: 5400000, lastPeriod: '2025-Q2',
  byPeriod: [
    { period: '2024-Q4', totalAmount: 4900000, perShare: 50 },
    { period: '2025-Q1', totalAmount: 5880000, perShare: 60 },
    { period: '2025-Q2', totalAmount: 6860000, perShare: 70 },
  ],
  dividends: [],
});

const mockResolutions = () => ({
  total: 8, passed: 4, proposed: 4, rejected: 0,
  byStatus: [{ status: 'passed', count: 2 }, { status: 'implemented', count: 2 }, { status: 'proposed', count: 4 }],
  resolutions: [
    { title: 'Approval of FY2025 Annual Budget', status: 'passed', resolution_date: '2025-01-20', proposed_by: 'CFO' },
    { title: 'Dividend Declaration Q4 2024', status: 'implemented', resolution_date: '2025-01-20', proposed_by: 'Board Chair' },
  ],
});

const statusBadge = (status) => {
  const map = {
    completed: { bg: '#dcfce7', color: '#166534' },
    scheduled: { bg: '#dbeafe', color: '#1e40af' },
    passed: { bg: '#dcfce7', color: '#166534' },
    implemented: { bg: '#dbeafe', color: '#1e40af' },
    proposed: { bg: '#fef3c7', color: '#92400e' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    active: { bg: '#dcfce7', color: '#166534' },
    inactive: { bg: '#f1f5f9', color: '#475569' },
    declared: { bg: '#fef3c7', color: '#92400e' },
    paid: { bg: '#dcfce7', color: '#166534' },
    draft: { bg: '#f1f5f9', color: '#475569' },
    final: { bg: '#dbeafe', color: '#1e40af' },
    distributed: { bg: '#dcfce7', color: '#166534' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
};

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: 'white', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' };

const actionBtn = { padding: '0.25rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 };

const CEOBoard = () => {
  const [meetings, setMeetings] = useState(null);
  const [shareholders, setShareholders] = useState(null);
  const [dividends, setDividends] = useState(null);
  const [resolutions, setResolutions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('meetings');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showShareholderModal, setShowShareholderModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [editShareholder, setEditShareholder] = useState(null);
  const [editResolution, setEditResolution] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, s, d, r] = await Promise.allSettled([
        ceoService.getBoardMeetings(),
        ceoService.getShareholderRegistry(),
        ceoService.getDividendStatus(),
        ceoService.getBoardResolutions(),
      ]);
      setMeetings(m.value?.data?.data || mockMeetings());
      setShareholders(s.value?.data?.data || mockShareholders());
      setDividends(d.value?.data?.data || mockDividends());
      setResolutions(r.value?.data?.data || mockResolutions());
      const failures = [m, s, d, r].filter(r => r.status === 'rejected');
      if (failures.length > 0) setError(`${failures.length} Board API(s) failed, using sample data`);
    } catch (e) {
      setError('Failed to load board data, using sample data');
      setMeetings(mockMeetings());
      setShareholders(mockShareholders());
      setDividends(mockDividends());
      setResolutions(mockResolutions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (type, apiCall) => {
    setSubmitting(true);
    try {
      await apiCall(formData);
      setFormData({});
      if (type === 'meeting') setShowMeetingModal(false);
      if (type === 'shareholder') setShowShareholderModal(false);
      if (type === 'resolution') setShowResolutionModal(false);
      await fetchAll();
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (type) => {
    setSubmitting(true);
    try {
      if (type === 'meeting') {
        await ceoService.updateBoardMeeting(editMeeting.id, editFormData);
        setEditMeeting(null);
      } else if (type === 'shareholder') {
        await ceoService.updateShareholder(editShareholder.id, editFormData);
        setEditShareholder(null);
      } else if (type === 'resolution') {
        await ceoService.updateBoardResolution(editResolution.id, editFormData);
        setEditResolution(null);
      }
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
      if (deleteConfirm.type === 'meeting') {
        await ceoService.deleteBoardMeeting(deleteConfirm.id);
      } else if (deleteConfirm.type === 'shareholder') {
        await ceoService.deleteShareholder(deleteConfirm.id);
      } else if (deleteConfirm.type === 'resolution') {
        await ceoService.deleteBoardResolution(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      await fetchAll();
    } catch (e) {
      alert('Failed to delete: ' + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Board & Governance</h1>
        </div>
        <div className={styles.placeholderModule}>
          <div className={styles.placeholderTitle}>Loading board data...</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'meetings', label: 'Meetings' },
    { id: 'shareholders', label: 'Shareholders' },
    { id: 'dividends', label: 'Dividends' },
    { id: 'resolutions', label: 'Resolutions' },
  ];

  const sharePie = shareholders?.shareholders?.map(s => ({ name: s.name, value: parseFloat(s.share_percentage), type: s.share_type })) || [];

  const dividendChart = dividends?.byPeriod?.map(d => ({ period: d.period, Amount: d.totalAmount, perShare: d.perShare })) || [];

  const resStatusData = resolutions?.byStatus?.map(s => ({ name: s.status, value: s.count, fill: s.status === 'passed' || s.status === 'implemented' ? '#10B981' : s.status === 'proposed' ? '#F59E0B' : s.status === 'rejected' ? '#EF4444' : '#6B7280' })) || [];

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Board & Governance</h1>
        <p className={styles.pageSubtitle}>Meeting packs, shareholder registry, dividends, and board resolutions</p>
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

      {activeTab === 'meetings' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Meetings</div>
                <div className={styles.statValue}>{formatNumber(meetings?.totalMeetings)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Completed</div>
                <div className={styles.statValue} style={{ color: '#059669' }}>{formatNumber(meetings?.completedMeetings)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Scheduled</div>
                <div className={styles.statValue} style={{ color: '#2563eb' }}>{formatNumber(meetings?.scheduledMeetings)}</div>
              </div>
            </div>
            <button onClick={() => setShowMeetingModal(true)}
              style={{ marginLeft: '1rem', padding: '0.625rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Schedule Meeting
            </button>
          </div>

          {meetings?.upcomingMeetings?.length > 0 && (
            <div className={styles.ceoCard} style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#0f172a' }}>Upcoming Meetings</h3>
              {meetings.upcomingMeetings.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < meetings.upcomingMeetings.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{new Date(m.meeting_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {m.venue}</div>
                  </div>
                  {statusBadge(m.status)}
                </div>
              ))}
            </div>
          )}

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>All Meetings</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Meeting</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Venue</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings?.meetings?.map((m, i) => (
                    <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{m.title}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{new Date(m.meeting_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{m.venue}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(m.status)}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <button style={actionBtn} onClick={() => { setEditMeeting(m); setEditFormData(m); }}>Edit</button>
                        <button style={{ ...actionBtn, marginLeft: '0.375rem', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteConfirm({ type: 'meeting', id: m.id, title: m.title })}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'shareholders' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Shareholders</div>
                <div className={styles.statValue}>{formatNumber(shareholders?.totalShareholders)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Active</div>
                <div className={styles.statValue} style={{ color: '#059669' }}>{formatNumber(shareholders?.activeShareholders)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Active Ownership</div>
                <div className={styles.statValue}>{shareholders?.totalActivePercentage}%</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Shares Issued</div>
                <div className={styles.statValue}>{formatNumber(shareholders?.totalSharesIssued)}</div>
              </div>
            </div>
            <button onClick={() => setShowShareholderModal(true)}
              style={{ marginLeft: '1rem', padding: '0.625rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Add Shareholder
            </button>
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Ownership Distribution</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={sharePie} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name.split(' ')[0]} ${value}%`}>
                      {sharePie.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Shareholder Registry</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Shares</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>%</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareholders?.shareholders?.map((s, i) => (
                      <tr key={s.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatNumber(s.shares_count)}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{parseFloat(s.share_percentage).toFixed(1)}%</td>
                        <td style={{ padding: '0.5rem 0.75rem', textTransform: 'capitalize' }}>{s.share_type}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(s.status)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <button style={actionBtn} onClick={() => { setEditShareholder(s); setEditFormData(s); }}>Edit</button>
                          <button style={{ ...actionBtn, marginLeft: '0.375rem', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteConfirm({ type: 'shareholder', id: s.id, title: s.name })}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'dividends' && (
        <>
          <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Declared</div>
              <div className={styles.statValue}>{formatCurrency(dividends?.totalDeclared)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Paid</div>
              <div className={styles.statValue} style={{ color: '#059669' }}>{formatCurrency(dividends?.totalPaid)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pending Payout</div>
              <div className={styles.statValue} style={{ color: '#F59E0B' }}>{formatCurrency(dividends?.pendingPayout)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Latest Period</div>
              <div className={styles.statValue} style={{ fontSize: '1.25rem' }}>{dividends?.lastPeriod}</div>
            </div>
          </div>

          <div className={styles.ceoCard} style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Dividend Trends by Period</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dividendChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Dividend Summary by Period</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Period</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Per Share</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends?.byPeriod?.map((d, i) => (
                    <tr key={d.period} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{d.period}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatCurrency(d.totalAmount)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatCurrency(d.perShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'resolutions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Resolutions</div>
                <div className={styles.statValue}>{formatNumber(resolutions?.total)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Passed / Implemented</div>
                <div className={styles.statValue} style={{ color: '#059669' }}>{formatNumber(resolutions?.passed)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Proposed</div>
                <div className={styles.statValue} style={{ color: '#F59E0B' }}>{formatNumber(resolutions?.proposed)}</div>
              </div>
            </div>
            <button onClick={() => setShowResolutionModal(true)}
              style={{ marginLeft: '1rem', padding: '0.625rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + New Resolution
            </button>
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Resolution Status</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={resStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {resStatusData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>All Resolutions</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Title</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Proposed By</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolutions?.resolutions?.map((r, i) => (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{r.title}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{r.proposed_by || '-'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{r.resolution_date ? new Date(r.resolution_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Pending'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(r.status)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <button style={actionBtn} onClick={() => { setEditResolution(r); setEditFormData(r); }}>Edit</button>
                          <button style={{ ...actionBtn, marginLeft: '0.375rem', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteConfirm({ type: 'resolution', id: r.id, title: r.title })}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Create Modals --- */}
      {showMeetingModal && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowMeetingModal(false); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Schedule Board Meeting</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Meeting Title *</label>
                <input style={inputStyle} value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q4 2025 Board Meeting" />
              </div>
              <div>
                <label style={labelStyle}>Date *</label>
                <input style={inputStyle} type="date" value={formData.meeting_date || ''} onChange={e => setFormData({...formData, meeting_date: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Time</label>
                <input style={inputStyle} type="time" value={formData.meeting_time || ''} onChange={e => setFormData({...formData, meeting_time: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Venue</label>
                <input style={inputStyle} value={formData.venue || ''} onChange={e => setFormData({...formData, venue: e.target.value})} placeholder="e.g. Executive Boardroom" />
              </div>
              <div>
                <label style={labelStyle}>Agenda</label>
                <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} value={formData.agenda || ''} onChange={e => setFormData({...formData, agenda: e.target.value})} placeholder="Key items to discuss..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowMeetingModal(false)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleSubmit('meeting', ceoService.createBoardMeeting(formData))} disabled={submitting || !formData.title || !formData.meeting_date} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.title || !formData.meeting_date ? 'not-allowed' : 'pointer', opacity: submitting || !formData.title || !formData.meeting_date ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareholderModal && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowShareholderModal(false); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Add Shareholder</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full name or entity name" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+251 9XX XXX XXXX" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Share %</label>
                  <input style={inputStyle} type="number" step="0.01" value={formData.share_percentage || ''} onChange={e => setFormData({...formData, share_percentage: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Share Count</label>
                  <input style={inputStyle} type="number" value={formData.shares_count || ''} onChange={e => setFormData({...formData, shares_count: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Share Type</label>
                  <select style={inputStyle} value={formData.share_type || 'ordinary'} onChange={e => setFormData({...formData, share_type: e.target.value})}>
                    <option value="ordinary">Ordinary</option>
                    <option value="preferred">Preferred</option>
                    <option value="founder">Founder</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Join Date</label>
                  <input style={inputStyle} type="date" value={formData.joined_date || ''} onChange={e => setFormData({...formData, joined_date: e.target.value})} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowShareholderModal(false)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleSubmit('shareholder', ceoService.createShareholder(formData))} disabled={submitting || !formData.name} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.name ? 'not-allowed' : 'pointer', opacity: submitting || !formData.name ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Add Shareholder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolutionModal && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowResolutionModal(false); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>New Board Resolution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Resolution Title *</label>
                <input style={inputStyle} value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Approval of Annual Budget" />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed description of the resolution..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Proposed By</label>
                  <input style={inputStyle} value={formData.proposed_by || ''} onChange={e => setFormData({...formData, proposed_by: e.target.value})} placeholder="e.g. CFO, Board Chair" />
                </div>
                <div>
                  <label style={labelStyle}>Resolution Date</label>
                  <input style={inputStyle} type="date" value={formData.resolution_date || ''} onChange={e => setFormData({...formData, resolution_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Meeting (optional)</label>
                <select style={inputStyle} value={formData.meeting_id || ''} onChange={e => setFormData({...formData, meeting_id: e.target.value || null})}>
                  <option value="">— Not linked to a meeting —</option>
                  {meetings?.meetings?.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({new Date(m.meeting_date).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowResolutionModal(false)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleSubmit('resolution', ceoService.createBoardResolution(formData))} disabled={submitting || !formData.title} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.title ? 'not-allowed' : 'pointer', opacity: submitting || !formData.title ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Create Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Meeting Modal --- */}
      {editMeeting && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setEditMeeting(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Meeting</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Meeting Title *</label>
                <input style={inputStyle} value={editFormData.title || ''} onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Date *</label>
                <input style={inputStyle} type="date" value={editFormData.meeting_date || ''} onChange={e => setEditFormData({...editFormData, meeting_date: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Time</label>
                <input style={inputStyle} type="time" value={editFormData.meeting_time || ''} onChange={e => setEditFormData({...editFormData, meeting_time: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Venue</label>
                <input style={inputStyle} value={editFormData.venue || ''} onChange={e => setEditFormData({...editFormData, venue: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={editFormData.status || 'scheduled'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Agenda</label>
                <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} value={editFormData.agenda || ''} onChange={e => setEditFormData({...editFormData, agenda: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setEditMeeting(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleEditSubmit('meeting')} disabled={submitting || !editFormData.title || !editFormData.meeting_date} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.title || !editFormData.meeting_date ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.title || !editFormData.meeting_date ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Shareholder Modal --- */}
      {editShareholder && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setEditShareholder(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Shareholder</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Share %</label>
                  <input style={inputStyle} type="number" step="0.01" value={editFormData.share_percentage || ''} onChange={e => setEditFormData({...editFormData, share_percentage: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Share Count</label>
                  <input style={inputStyle} type="number" value={editFormData.shares_count || ''} onChange={e => setEditFormData({...editFormData, shares_count: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Share Type</label>
                  <select style={inputStyle} value={editFormData.share_type || 'ordinary'} onChange={e => setEditFormData({...editFormData, share_type: e.target.value})}>
                    <option value="ordinary">Ordinary</option>
                    <option value="preferred">Preferred</option>
                    <option value="founder">Founder</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={editFormData.status || 'active'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setEditShareholder(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleEditSubmit('shareholder')} disabled={submitting || !editFormData.name} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.name ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.name ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Resolution Modal --- */}
      {editResolution && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setEditResolution(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Resolution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Resolution Title *</label>
                <input style={inputStyle} value={editFormData.title || ''} onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Proposed By</label>
                  <input style={inputStyle} value={editFormData.proposed_by || ''} onChange={e => setEditFormData({...editFormData, proposed_by: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Resolution Date</label>
                  <input style={inputStyle} type="date" value={editFormData.resolution_date || ''} onChange={e => setEditFormData({...editFormData, resolution_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={editFormData.status || 'proposed'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="proposed">Proposed</option>
                  <option value="passed">Passed</option>
                  <option value="rejected">Rejected</option>
                  <option value="implemented">Implemented</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Meeting (optional)</label>
                <select style={inputStyle} value={editFormData.meeting_id || ''} onChange={e => setEditFormData({...editFormData, meeting_id: e.target.value || null})}>
                  <option value="">— Not linked to a meeting —</option>
                  {meetings?.meetings?.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({new Date(m.meeting_date).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setEditResolution(null)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => handleEditSubmit('resolution')} disabled={submitting || !editFormData.title} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.title ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.title ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation --- */}
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

export default CEOBoard;
