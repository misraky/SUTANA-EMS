import React, { useState, useEffect } from 'react';
import { Send, FileText, Plus, X, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import financeService from '../../services/financeService';
import styles from './ReportSubmissions.module.css';

const REPORT_TYPES = [
  { value: 'income_statement', label: 'Income Statement (P&L)' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'bank_reconciliation', label: 'Bank Reconciliation' }
];

const STATUS_MAP = {
  draft: { label: 'Draft', icon: Clock, color: '#64748b' },
  submitted: { label: 'Pending CEO', icon: AlertCircle, color: '#f59e0b' },
  ceo_approved: { label: 'CEO Approved', icon: CheckCircle, color: '#3b82f6' },
  board_approved: { label: 'Board Approved', icon: CheckCircle, color: '#16a34a' },
  rejected: { label: 'Rejected', icon: X, color: '#ef4444' }
};

const ReportSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  const [form, setForm] = useState({
    reportType: 'income_statement',
    period: '',
    financialYear: '',
    title: '',
    notes: ''
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotif = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await financeService.getReportSubmissions();
      if (res.status === 'success') setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.period) {
      showNotif('Please enter the report period (YYYY-MM).', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await financeService.createReportSubmission(form);
      if (res.status === 'success') {
        showNotif('Draft created successfully.', 'success');
        setShowForm(false);
        setForm({ reportType: 'income_statement', period: '', financialYear: '', title: '', notes: '' });
        await fetchSubmissions();
      }
    } catch (err) {
      showNotif('Failed to create draft.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (id) => {
    try {
      setSubmittingId(id);
      const res = await financeService.submitReportForApproval(id);
      if (res.status === 'success') {
        showNotif('Report submitted for CEO approval.', 'success');
        await fetchSubmissions();
      }
    } catch (err) {
      showNotif('Failed to submit report.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const currentYear = new Date().getFullYear();
  const defaultPeriod = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Report Submissions</h2>
          <p>Create financial reports and submit them for CEO & Board approval.</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowForm(true)}>
          <Plus size={18} /> New Submission
        </button>
      </div>

      {notification.show && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>
      )}

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h3>New Report Submission</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label>Report Type</label>
                <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}>
                  {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Period (YYYY-MM)</label>
                <input type="text" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder={defaultPeriod} />
              </div>
              <div className={styles.formGroup}>
                <label>Financial Year (optional)</label>
                <input type="text" value={form.financialYear} onChange={(e) => setForm({ ...form, financialYear: e.target.value })} placeholder="e.g. 2025-2026" />
              </div>
              <div className={styles.formGroup}>
                <label>Title (optional)</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monthly Financial Report - June 2026" />
              </div>
              <div className={styles.formGroup}>
                <label>Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any additional information..." />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : submissions.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={48} color="#94a3b8" />
          <h3>No submissions yet</h3>
          <p>Create a new report submission to start the approval workflow.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report Type</th>
                <th>Period</th>
                <th>Title</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => {
                const st = STATUS_MAP[sub.status] || STATUS_MAP.draft;
                const StatusIcon = st.icon;
                return (
                  <tr key={sub.id}>
                    <td>{REPORT_TYPES.find(t => t.value === sub.report_type)?.label || sub.report_type}</td>
                    <td>{sub.period}</td>
                    <td>{sub.title || '-'}</td>
                    <td><span className={styles.statusBadge} style={{ background: `${st.color}18`, color: st.color }}><StatusIcon size={14} /> {st.label}</span></td>
                    <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <button className={styles.iconBtn} title="View Details"><Eye size={16} /></button>
                        {sub.status === 'draft' && (
                          <button className={styles.submitActionBtn} onClick={() => handleSubmit(sub.id)} disabled={submittingId === sub.id}>
                            <Send size={14} /> {submittingId === sub.id ? 'Sending...' : 'Submit'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportSubmissions;
