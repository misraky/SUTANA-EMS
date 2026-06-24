import React, { useState, useEffect } from 'react';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import styles from './CEODashboard.module.css';

const mockStatus = () => ({ isActive: false, activatedAt: null, activatedBy: null, reason: 'Normal operations', activeActions: 4, pendingApprovals: 1 });

const mockActions = () => ({
  totalActions: 4,
  byStatus: [{ status: 'pending', count: 4 }],
  byPriority: [{ priority: 'critical', count: 2 }, { priority: 'high', count: 2 }],
  actions: [
    { title: 'Activate Business Continuity Plan', priority: 'critical', status: 'pending', assigned_to: 'CEO', deadline: '2025-12-31' },
    { title: 'Communicate with Stakeholders', priority: 'critical', status: 'pending', assigned_to: 'Communications Lead', deadline: '2025-12-31' },
    { title: 'Secure Critical Infrastructure', priority: 'high', status: 'pending', assigned_to: 'IT Director', deadline: '2025-12-31' },
    { title: 'Establish Emergency Command Center', priority: 'high', status: 'pending', assigned_to: 'Operations Manager', deadline: '2025-12-31' },
  ],
});

const mockFastTrack = () => ({
  totalRequests: 2, pendingRequests: 1, totalApprovedAmount: 2500000,
  byStatus: [{ status: 'approved', count: 1 }, { status: 'pending', count: 1 }],
  items: [
    { request_title: 'Emergency IT Infrastructure Upgrade', amount: 2500000, requested_by: 'Sarah Akinyi', status: 'approved', approved_by: 'CEO' },
    { request_title: 'Urgent Supplier Payment Release', amount: 1800000, requested_by: 'Joseph Kiprop', status: 'pending' },
  ],
});

const statusBadge = (status) => {
  const map = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    'in-progress': { bg: '#dbeafe', color: '#1e40af' },
    completed: { bg: '#dcfce7', color: '#166534' },
    approved: { bg: '#dcfce7', color: '#166534' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    critical: { bg: '#fee2e2', color: '#991b1b' },
    high: { bg: '#fef3c7', color: '#92400e' },
    medium: { bg: '#dbeafe', color: '#1e40af' },
    low: { bg: '#dcfce7', color: '#166534' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>{status}</span>;
};

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { background: 'white', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' };
const actionBtn = { padding: '0.25rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 };

const CEOCrisis = () => {
  const [status, setStatus] = useState(null);
  const [actions, setActions] = useState(null);
  const [fastTrack, setFastTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [submitting, setSubmitting] = useState(false);

  const [showCreateAction, setShowCreateAction] = useState(false);
  const [formData, setFormData] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFastTrackModal, setShowFastTrackModal] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, a, f] = await Promise.allSettled([
        ceoService.getCrisisStatus(),
        ceoService.getEmergencyActions(),
        ceoService.getFastTrackApprovals(),
      ]);
      setStatus(s.value?.data?.data || mockStatus());
      setActions(a.value?.data?.data || mockActions());
      setFastTrack(f.value?.data?.data || mockFastTrack());
      const failures = [s, a, f].filter(r => r.status === 'rejected');
      if (failures.length > 0) setError(`${failures.length} Crisis API(s) failed, using sample data`);
    } catch (e) {
      setError('Failed to load crisis data, using sample data');
      setStatus(mockStatus()); setActions(mockActions()); setFastTrack(mockFastTrack());
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    load();
  }, []);

  const handleActivate = async () => {
    setSubmitting(true);
    try {
      const s = await ceoService.activateCrisisMode({ reason: 'Crisis mode activated by CEO' });
      setStatus(s.data?.data);
    } catch (e) {
      alert('Failed to activate: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const handleDeactivate = async () => {
    setSubmitting(true);
    try {
      const s = await ceoService.deactivateCrisisMode();
      setStatus(s.data?.data);
    } catch (e) {
      alert('Failed to deactivate: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const handleCreateAction = async () => {
    setSubmitting(true);
    try {
      await ceoService.createEmergencyAction(formData);
      setFormData({});
      setShowCreateAction(false);
      await fetchAll();
    } catch (e) {
      alert('Failed to create: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const handleEditAction = async () => {
    if (!editItem) return;
    setSubmitting(true);
    try {
      await ceoService.updateEmergencyAction(editItem.id, editFormData);
      setEditItem(null);
      setEditFormData({});
      await fetchAll();
    } catch (e) {
      alert('Failed to update: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const handleDeleteAction = async () => {
    if (!deleteConfirm) return;
    setSubmitting(true);
    try {
      await ceoService.deleteEmergencyAction(deleteConfirm.id);
      setDeleteConfirm(null);
      await fetchAll();
    } catch (e) {
      alert('Failed to delete: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const handleFastTrackRequest = async () => {
    setSubmitting(true);
    try {
      await ceoService.fastTrackApproval(formData);
      setFormData({});
      setShowFastTrackModal(false);
      await fetchAll();
    } catch (e) {
      alert('Failed to submit: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const handleApprove = async (id) => {
    setSubmitting(true);
    try {
      await ceoService.approveFastTrack(id);
      await fetchAll();
    } catch (e) {
      alert('Failed to approve: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const handleReject = async (id) => {
    setSubmitting(true);
    try {
      await ceoService.rejectFastTrack(id);
      await fetchAll();
    } catch (e) {
      alert('Failed to reject: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className={styles.dashboardContent}>
      <div className={styles.pageHeader}><h1 className={styles.pageTitle}>Crisis Management</h1></div>
      <div className={styles.placeholderModule}><div className={styles.placeholderTitle}>Loading crisis data...</div></div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'actions', label: 'Emergency Actions' },
    { id: 'fast-track', label: 'Fast-Track Approvals' },
  ];

  const isActive = status?.isActive;

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Crisis Management</h1>
        <p className={styles.pageSubtitle}>Crisis mode toggle, emergency actions, and fast-track approvals</p>
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

      {activeTab === 'overview' && (
        <>
          <div className={styles.ceoCard} style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{isActive ? '🚨' : '✅'}</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: isActive ? '#dc2626' : '#059669', marginBottom: '0.5rem' }}>
              {isActive ? 'CRISIS MODE ACTIVE' : 'Normal Operations'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '1rem' }}>{status?.reason}</p>
            {isActive ? (
              <button onClick={handleDeactivate} disabled={submitting} style={{ padding: '0.75rem 2rem', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Deactivating...' : 'Deactivate Crisis Mode'}
              </button>
            ) : (
              <button onClick={handleActivate} disabled={submitting} style={{ padding: '0.75rem 2rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Activating...' : 'Activate Crisis Mode'}
              </button>
            )}
            {isActive && status?.activatedAt && (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.75rem' }}>
                Activated {new Date(status.activatedAt).toLocaleString()} by {status.activatedBy}
              </p>
            )}
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Active Emergency Actions</div>
              <div className={styles.statValue} style={{ color: status?.activeActions > 0 ? '#F59E0B' : '#059669' }}>{formatNumber(status?.activeActions)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pending Approvals</div>
              <div className={styles.statValue} style={{ color: status?.pendingApprovals > 0 ? '#F59E0B' : '#059669' }}>{formatNumber(status?.pendingApprovals)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Actions</div>
              <div className={styles.statValue}>{formatNumber(actions?.totalActions)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Approved Amount</div>
              <div className={styles.statValue}>{formatCurrency(fastTrack?.totalApprovedAmount)}</div>
            </div>
          </div>

          <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Actions by Priority</h3>
              {actions?.byPriority?.map(p => (
                <div key={p.priority} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p.priority}</span>
                  <span>{formatNumber(p.count)}</span>
                </div>
              ))}
            </div>
            <div className={styles.ceoCard}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Actions by Status</h3>
              {actions?.byStatus?.map(s => (
                <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{s.status}</span>
                  <span>{formatNumber(s.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'actions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowCreateAction(true)}
              style={{ padding: '0.625rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              + New Action
            </button>
          </div>

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Emergency Actions</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Action</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Priority</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Assigned To</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Deadline</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {actions?.actions?.map((a, i) => (
                    <tr key={a.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{a.title}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(a.priority)}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(a.status)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{a.assigned_to}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{a.deadline ? new Date(a.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <button style={actionBtn} onClick={() => { setEditItem(a); setEditFormData(a); }}>Edit</button>
                        <button style={{ ...actionBtn, marginLeft: '0.375rem', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteConfirm({ id: a.id, title: a.title })}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'fast-track' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', flex: 1, marginBottom: 0 }}>
              <div className={styles.statCard}><div className={styles.statLabel}>Total Requests</div><div className={styles.statValue}>{formatNumber(fastTrack?.totalRequests)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Pending</div><div className={styles.statValue} style={{ color: '#F59E0B' }}>{formatNumber(fastTrack?.pendingRequests)}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Approved Amount</div><div className={styles.statValue} style={{ color: '#059669' }}>{formatCurrency(fastTrack?.totalApprovedAmount)}</div></div>
            </div>
            <button onClick={() => setShowFastTrackModal(true)}
              style={{ marginLeft: '1rem', padding: '0.625rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + New Request
            </button>
          </div>

          <div className={styles.ceoCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>Fast-Track Approval Requests</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Request</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Requested By</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fastTrack?.items?.map((r, i) => (
                    <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{r.request_title}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{r.amount ? formatCurrency(r.amount) : '-'}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{r.requested_by}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{statusBadge(r.status)}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {r.status === 'pending' ? (
                          <>
                            <button style={{ ...actionBtn, color: '#059669', borderColor: '#a7f3d0' }} onClick={() => handleApprove(r.id)} disabled={submitting}>Approve</button>
                            <button style={{ ...actionBtn, marginLeft: '0.375rem', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleReject(r.id)} disabled={submitting}>Reject</button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            {r.status === 'approved' ? `Approved by ${r.approved_by || 'CEO'}` : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Action Modal */}
      {showCreateAction && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowCreateAction(false); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>New Emergency Action</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Action Title *</label><input style={inputStyle} value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Activate BCP" /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Priority</label><select style={inputStyle} value={formData.priority || 'high'} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select></div>
                <div><label style={labelStyle}>Assigned To</label><input style={inputStyle} value={formData.assigned_to || ''} onChange={e => setFormData({...formData, assigned_to: e.target.value})} /></div>
              </div>
              <div><label style={labelStyle}>Deadline</label><input style={inputStyle} type="date" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowCreateAction(false)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleCreateAction} disabled={submitting || !formData.title} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.title ? 'not-allowed' : 'pointer', opacity: submitting || !formData.title ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Create Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Action Modal */}
      {editItem && (
        <div style={modalOverlay} onClick={() => { if (!submitting) { setEditItem(null); setEditFormData({}); } }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit Emergency Action</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Action Title *</label><input style={inputStyle} value={editFormData.title || ''} onChange={e => setEditFormData({...editFormData, title: e.target.value})} /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Priority</label><select style={inputStyle} value={editFormData.priority || 'high'} onChange={e => setEditFormData({...editFormData, priority: e.target.value})}>
                  <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select></div>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={editFormData.status || 'pending'} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                  <option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Assigned To</label><input style={inputStyle} value={editFormData.assigned_to || ''} onChange={e => setEditFormData({...editFormData, assigned_to: e.target.value})} /></div>
                <div><label style={labelStyle}>Deadline</label><input style={inputStyle} type="date" value={editFormData.deadline || ''} onChange={e => setEditFormData({...editFormData, deadline: e.target.value})} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => { setEditItem(null); setEditFormData({}); }} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleEditAction} disabled={submitting || !editFormData.title} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !editFormData.title ? 'not-allowed' : 'pointer', opacity: submitting || !editFormData.title ? 0.6 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Fast-Track Modal */}
      {showFastTrackModal && (
        <div style={modalOverlay} onClick={() => { if (!submitting) setShowFastTrackModal(false); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>New Fast-Track Request</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div><label style={labelStyle}>Request Title *</label><input style={inputStyle} value={formData.request_title || ''} onChange={e => setFormData({...formData, request_title: e.target.value})} placeholder="e.g. Emergency Supplier Payment" /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight: '60px', resize: 'vertical'}} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>Amount (ETB)</label><input style={inputStyle} type="number" step="0.01" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                <div><label style={labelStyle}>Requested By</label><input style={inputStyle} value={formData.requested_by || ''} onChange={e => setFormData({...formData, requested_by: e.target.value})} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowFastTrackModal(false)} disabled={submitting} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleFastTrackRequest} disabled={submitting || !formData.request_title} style={{ padding: '0.5rem 1.25rem', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting || !formData.request_title ? 'not-allowed' : 'pointer', opacity: submitting || !formData.request_title ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
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
              <button onClick={handleDeleteAction} disabled={submitting} style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOCrisis;
