import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import ceoService from '../../services/ceoService';
import styles from './ReportApprovals.module.css';

const TABS = [
  { key: 'ceo', label: 'Pending CEO Approval' },
  { key: 'board', label: 'Pending Board Approval' },
  { key: 'history', label: 'All Submissions' }
];

const REPORT_TYPE_LABELS = {
  income_statement: 'Income Statement',
  balance_sheet: 'Balance Sheet',
  bank_reconciliation: 'Bank Reconciliation'
};

const STATUS_MAP = {
  draft: { label: 'Draft', color: '#64748b' },
  submitted: { label: 'Pending CEO', color: '#f59e0b' },
  ceo_approved: { label: 'CEO Approved', color: '#3b82f6' },
  board_approved: { label: 'Board Approved', color: '#16a34a' },
  rejected: { label: 'Rejected', color: '#ef4444' }
};

const ReportApprovals = () => {
  const [activeTab, setActiveTab] = useState('ceo');
  const [pendingCEO, setPendingCEO] = useState([]);
  const [pendingBoard, setPendingBoard] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const showNotif = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'ceo') {
        const res = await ceoService.getPendingCEOApprovals();
        if (res.status === 'success') setPendingCEO(res.data);
      } else if (activeTab === 'board') {
        const res = await ceoService.getPendingBoardApprovals();
        if (res.status === 'success') setPendingBoard(res.data);
      } else {
        const res = await ceoService.getAllReportSubmissions();
        if (res.status === 'success') setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch approvals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      setActionLoading(id);
      if (action === 'ceo-approve') {
        await ceoService.ceoApproveReport(id, comment);
        showNotif('Report approved at CEO level.', 'success');
      } else if (action === 'board-approve') {
        await ceoService.boardApproveReport(id, comment);
        showNotif('Report approved at Board level.', 'success');
      } else if (action === 'reject') {
        if (!reason) { showNotif('Please provide a rejection reason.', 'error'); setActionLoading(null); return; }
        await ceoService.rejectReport(id, reason);
        showNotif('Report rejected.', 'success');
      }
      setExpandedId(null);
      setComment('');
      setReason('');
      await fetchData();
    } catch (err) {
      showNotif('Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const renderTable = (data, actions) => (
    <div className={styles.tableWrapper}>
      {data.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={40} color="#94a3b8" />
          <p>No reports in this stage.</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Report Type</th>
              <th>Period</th>
              <th>Title</th>
              <th>Submitted By</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map(sub => {
              const st = STATUS_MAP[sub.status] || STATUS_MAP.draft;
              const isExpanded = expandedId === sub.id;
              return (
                <React.Fragment key={sub.id}>
                  <tr className={styles.clickableRow} onClick={() => setExpandedId(isExpanded ? null : sub.id)}>
                    <td>{REPORT_TYPE_LABELS[sub.report_type] || sub.report_type}</td>
                    <td>{sub.period}</td>
                    <td>{sub.title || '-'}</td>
                    <td>{sub.submitted_by_name}</td>
                    <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                    <td><span className={styles.statusBadge} style={{ background: `${st.color}18`, color: st.color }}>{st.label}</span></td>
                    <td>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</td>
                  </tr>
                  {isExpanded && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={7}>
                        <div className={styles.detailPanel}>
                          <div className={styles.detailGrid}>
                            <div><strong>Financial Year:</strong> {sub.financial_year || '-'}</div>
                            <div><strong>Notes:</strong> {sub.notes || '-'}</div>
                            {sub.ceo_comment && <div><strong>CEO Comment:</strong> {sub.ceo_comment}</div>}
                            {sub.board_comment && <div><strong>Board Comment:</strong> {sub.board_comment}</div>}
                            {sub.rejection_reason && <div><strong>Rejection Reason:</strong> {sub.rejection_reason}</div>}
                          </div>
                          {actions && (
                            <div className={styles.actionPanel}>
                              {actions.includes('ceo-approve') && (
                                <div className={styles.actionBlock}>
                                  <textarea placeholder="Comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
                                  <button className={styles.approveBtn} onClick={() => handleAction(sub.id, 'ceo-approve')} disabled={actionLoading === sub.id}>
                                    <CheckCircle size={16} /> {actionLoading === sub.id ? 'Processing...' : 'Approve (CEO)'}
                                  </button>
                                </div>
                              )}
                              {actions.includes('board-approve') && (
                                <div className={styles.actionBlock}>
                                  <textarea placeholder="Comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
                                  <button className={styles.approveBtn} onClick={() => handleAction(sub.id, 'board-approve')} disabled={actionLoading === sub.id}>
                                    <CheckCircle size={16} /> {actionLoading === sub.id ? 'Processing...' : 'Approve (Board)'}
                                  </button>
                                </div>
                              )}
                              {actions.includes('reject') && (
                                <div className={styles.actionBlock}>
                                  <textarea placeholder="Rejection reason (required)..." value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                                  <button className={styles.rejectBtn} onClick={() => handleAction(sub.id, 'reject')} disabled={actionLoading === sub.id}>
                                    <XCircle size={16} /> {actionLoading === sub.id ? 'Processing...' : 'Reject'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Financial Report Approvals</h2>
        <p>Review and approve financial reports submitted by the Finance team.</p>
      </div>

      {notification.show && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>
      )}

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : activeTab === 'ceo' ? (
        renderTable(pendingCEO, ['ceo-approve', 'reject'])
      ) : activeTab === 'board' ? (
        renderTable(pendingBoard, ['board-approve', 'reject'])
      ) : (
        renderTable(history, null)
      )}
    </div>
  );
};

export default ReportApprovals;
