import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatDate } from '../../utils/formatters';
import styles from './HRLeaves.module.css';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const HRLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await hrService.getLeaveRequests(params);
      setLeaves(res.data?.data?.leaves || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeTab]);

  const handleApprove = async (leaveId) => {
    setActionLoading(true);
    try {
      await hrService.reviewLeave(leaveId, true, '');
      fetchLeaves();
    } catch (err) {
      alert('Failed to approve leave');
    } finally {
      setActionLoading(false);
    }
  };

  const openReject = (leave) => {
    setSelectedLeave(leave);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedLeave || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await hrService.reviewLeave(selectedLeave.id || selectedLeave.leaveId, false, rejectReason.trim());
      setShowRejectModal(false);
      setSelectedLeave(null);
      setRejectReason('');
      fetchLeaves();
    } catch (err) {
      alert('Failed to reject leave');
    } finally {
      setActionLoading(false);
    }
  };

  const calcDays = (start, end) => {
    if (!start || !end) return '-';
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const filtered = activeTab === 'all' ? leaves : leaves.filter(l => (l.status || '').toLowerCase() === activeTab);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Leave Requests</h1>
        <p className={styles.pageSubtitle}>Manage employee leave requests</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading leave requests...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyCell}>No leave requests found.</td></tr>
              ) : (
                filtered.map((lv, idx) => {
                  const days = calcDays(lv.startDate || lv.start_date, lv.endDate || lv.end_date);
                  const status = (lv.status || '').toLowerCase();
                  return (
                    <tr key={idx}>
                      <td className={styles.nameCell}>{lv.fullName || lv.full_name || lv.employeeName || lv.employee_name}</td>
                      <td>{lv.leaveType || lv.leave_type}</td>
                      <td>{formatDate(lv.startDate || lv.start_date)}</td>
                      <td>{formatDate(lv.endDate || lv.end_date)}</td>
                      <td className={styles.daysCell}>{days}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[status] || styles.pending}`}>
                          {lv.status}
                        </span>
                      </td>
                      <td>
                        {status === 'pending' && (
                          <div className={styles.actionBtns}>
                            <button
                              className={styles.approveBtn}
                              onClick={() => handleApprove(lv.id || lv.leaveId)}
                              disabled={actionLoading}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.rejectBtn}
                              onClick={() => openReject(lv)}
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {status !== 'pending' && <span className={styles.noAction}>-</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showRejectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reject Leave Request</h2>
              <button className={styles.closeBtn} onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>Provide a reason for rejecting this leave request.</p>
              <textarea
                className={styles.rejectInput}
                rows={4}
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button
                className={styles.rejectConfirmBtn}
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLeaves;
