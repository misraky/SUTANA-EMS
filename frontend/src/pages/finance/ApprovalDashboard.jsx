import React, { useState, useEffect, useCallback } from 'react';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ApprovalDashboard.module.css';

const TIER_LABELS = { manager: 'Manager', director: 'Director', ceo: 'CEO' };
const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', skipped: 'Skipped' };

const ApprovalDashboard = () => {
  const [pending, setPending]     = useState([]);
  const [history, setHistory]     = useState([]);
  const [summary, setSummary]     = useState({ totalPending: 0, totalAmount: 0 });
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage]     = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.getApprovalDashboard();
      setPending(res?.data?.data?.pending || []);
      setHistory(res?.data?.data?.history || []);
      setSummary(res?.data?.data?.summary || { totalPending: 0, totalAmount: 0 });
    } catch {
      showMessage('error', 'Failed to load approvals. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await financeService.processApprovalDecision(id, { approved: true, comments: '' });
      showMessage('success', 'Expense approved successfully.');
      fetchData();
    } catch (error) {
      showMessage('error', error?.response?.data?.message || 'Failed to approve expense.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || rejectReason.trim().length < 10) return;
    setActionLoading(rejectModal);
    try {
      await financeService.processApprovalDecision(rejectModal, { approved: false, comments: rejectReason });
      showMessage('success', 'Expense rejected.');
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (error) {
      showMessage('error', error?.response?.data?.message || 'Failed to reject expense.');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id) => { setRejectModal(id); setRejectReason(''); };
  const closeRejectModal = () => { setRejectModal(null); setRejectReason(''); };

  return (
    <div className={styles.container}>

      {/* ── Header ─────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>Approval Dashboard</h1>
            <p className={styles.subtitle}>Multi-tier expense approval workflow</p>
          </div>
        </div>

        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>⏳</span>
            <div>
              <span className={styles.summaryValue}>{summary.totalPending}</span>
              <span className={styles.summaryLabel}>Pending</span>
            </div>
          </div>
          <div className={`${styles.summaryCard} ${styles.amountCard}`}>
            <span className={styles.summaryIcon}>💰</span>
            <div>
              <span className={styles.summaryValue}>{formatCurrency(summary.totalAmount)}</span>
              <span className={styles.summaryLabel}>Total Pending Amount</span>
            </div>
          </div>
          <button className={styles.refreshBtn} onClick={fetchData} disabled={loading} title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? styles.spinning : ''}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Alert Banner ────────────────────────────── */}
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          {message.text}
        </div>
      )}

      {/* ── Reject Modal ────────────────────────────── */}
      {rejectModal && (
        <div className={styles.modalOverlay} onClick={closeRejectModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reject Expense</h3>
              <button className={styles.modalClose} onClick={closeRejectModal}>✕</button>
            </div>
            <p className={styles.modalHint}>Please provide a clear reason for rejection. This will be visible to the submitter.</p>
            <textarea
              className={styles.modalTextarea}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (minimum 10 characters)…"
              rows={4}
            />
            <div className={styles.charCount}>{rejectReason.length} / 10 min</div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeRejectModal}>Cancel</button>
              <button
                className={styles.rejectSubmitBtn}
                onClick={handleReject}
                disabled={rejectReason.trim().length < 10 || actionLoading === rejectModal}
              >
                {actionLoading === rejectModal ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending Approvals ───────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Pending Your Approval</h2>
          {!loading && pending.length > 0 && (
            <span className={styles.badge}>{pending.length}</span>
          )}
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading approvals…</p>
          </div>
        ) : pending.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✅</div>
            <p className={styles.emptyTitle}>All clear!</p>
            <p className={styles.emptySubtitle}>No expenses are currently awaiting your approval.</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {pending.map(item => (
              <div key={item.id} className={styles.approvalCard}>
                <div className={styles.cardHeader}>
                  <span className={`${styles.tierBadge} ${styles[item.tier]}`}>
                    {TIER_LABELS[item.tier] || item.tier} Tier
                  </span>
                  <span className={styles.cardAmount}>{formatCurrency(item.amount)}</span>
                </div>
                <p className={styles.cardDesc}>{item.description || '—'}</p>
                <div className={styles.cardMeta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaIcon}>🗂</span>
                    <span>{item.category_name || 'Uncategorized'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaIcon}>👤</span>
                    <span>{item.entered_by_name || 'Unknown'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaIcon}>📅</span>
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleApprove(item.expense_id)}
                    disabled={actionLoading === item.expense_id}
                  >
                    {actionLoading === item.expense_id ? 'Approving…' : '✓ Approve'}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => openRejectModal(item.expense_id)}
                    disabled={actionLoading === item.expense_id}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Approval History ────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Approval History</h2>
          {!loading && history.length > 0 && (
            <span className={styles.badge}>{history.length}</span>
          )}
        </div>
        {loading ? null : history.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <p className={styles.emptyTitle}>No history yet</p>
            <p className={styles.emptySubtitle}>Completed approvals and rejections will appear here.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Expense #</th>
                  <th>Category</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.id}>
                    <td className={styles.expenseId}>#{item.expense_id}</td>
                    <td>{item.category_name || '—'}</td>
                    <td><span className={`${styles.tierBadge} ${styles[item.tier]}`}>{TIER_LABELS[item.tier] || item.tier}</span></td>
                    <td><span className={`${styles.statusBadge} ${styles[item.status]}`}>{STATUS_LABELS[item.status] || item.status}</span></td>
                    <td className={styles.amountCell}>{formatCurrency(item.amount)}</td>
                    <td>{formatDate(item.actioned_at || item.created_at)}</td>
                    <td className={styles.commentCell} title={item.comments}>{item.comments || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ApprovalDashboard;
