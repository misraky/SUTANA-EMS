import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from '../../services/apiClient';
import styles from './PharmacyRequests.module.css';
import {
  ClipboardList, Clock, CheckCircle, XCircle, Package, RefreshCw,
  Bell, Eye, User, Phone, Pill, Truck, AlertCircle
} from 'lucide-react';

const TABS = [
  { key: 'pending', label: 'Pending', icon: <Clock size={16}/>, color: '#f59e0b' },
  { key: 'approved', label: 'Approved', icon: <CheckCircle size={16}/>, color: '#3b82f6' },
  { key: 'ready_for_pickup', label: 'Ready', icon: <Package size={16}/>, color: '#10b981' },
  { key: 'rejected', label: 'Rejected', icon: <XCircle size={16}/>, color: '#ef4444' },
];

const REJECTION_REASONS = [
  'Prescription expired',
  'Prescription unclear/illegible',
  'Medication out of stock',
  'Invalid prescription',
  'Other',
];

export default function PharmacyRequests() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [notification, setNotification] = useState(null);

  // Approve modal state
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const socketRef = useRef(null);

  const fetchRequests = useCallback(async (tab = activeTab) => {
    setLoading(true);
    try {
      const res = await axios.get(`/pharmacy/requests?status=${tab}`);
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  // Real-time socket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', { transports: ['websocket'] });

    socketRef.current.on('new-prescription-request', (data) => {
      setNewCount(c => c + 1);
      setNotification({ type: 'new', msg: `🆕 New request #${data.request_number} from ${data.customer_name} for ${data.medication_name}` });
      setTimeout(() => setNotification(null), 6000);
      if (activeTab === 'pending') fetchRequests('pending');
    });

    socketRef.current.on('request-status-updated', () => {
      fetchRequests(activeTab);
    });

    return () => socketRef.current?.disconnect();
  }, [activeTab, fetchRequests]);

  const handleApprove = async () => {
    if (!approveModal) return;
    setSubmitting(true);
    try {
      await axios.post(`/pharmacy/requests/${approveModal.id}/approve`);
      setApproveModal(null);
      setNewCount(c => Math.max(0, c - 1));
      fetchRequests(activeTab);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const finalReason = rejectReason === 'Other' ? customReason : rejectReason;
    if (!finalReason) { alert('Please select a rejection reason'); return; }
    setSubmitting(true);
    try {
      await axios.post(`/pharmacy/requests/${rejectModal.id}/reject`, { rejection_reason: finalReason });
      setRejectModal(null);
      setRejectReason('');
      setCustomReason('');
      fetchRequests(activeTab);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReady = async (id) => {
    try {
      await axios.put(`/pharmacy/requests/${id}/ready`);
      fetchRequests(activeTab);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleMarkComplete = async (id, status) => {
    try {
      await axios.put(`/pharmacy/requests/${id}/complete`, { status });
      fetchRequests(activeTab);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const tabCounts = requests.length;

  return (
    <div className={styles.container}>
      {/* Live Notification */}
      {notification && (
        <div className={styles.liveNotif}>
          <Bell size={16} /> {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ClipboardList size={24} color="#10b981" />
          <h2>Prescription Requests</h2>
          {newCount > 0 && <span className={styles.badge}>{newCount} new</span>}
        </div>
        <button className={styles.refreshBtn} onClick={() => fetchRequests(activeTab)}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            style={activeTab === tab.key ? { borderBottomColor: tab.color, color: tab.color } : {}}
            onClick={() => { setActiveTab(tab.key); setNewCount(0); }}
          >
            {tab.icon} {tab.label}
            {tab.key === 'pending' && newCount > 0 && (
              <span className={styles.tabBadge}>{newCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {[1,2,3].map(i => <div key={i} className={styles.skeleton}/>)}
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={64} color="#d1d5db" />
          <p>No {activeTab.replace('_', ' ')} requests</p>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map(req => (
            <div key={req.id} className={styles.requestCard}>
              <div className={styles.cardHeader}>
                <span className={styles.reqNum}>#{req.request_number}</span>
                <span className={styles.reqDate}>{new Date(req.requested_at).toLocaleString()}</span>
              </div>

              <div className={styles.cardGrid}>
                <div className={styles.infoBlock}>
                  <div className={styles.infoRow}><User size={14}/> <strong>{req.customer_name}</strong></div>
                  {req.customer_phone && <div className={styles.infoRow}><Phone size={14}/> {req.customer_phone}</div>}
                </div>
                <div className={styles.infoBlock}>
                  <div className={styles.infoRow}><Pill size={14}/> <strong>{req.medication_name}</strong> × {req.quantity}</div>
                  <div className={styles.infoRow}>
                    <Truck size={14}/>
                    {req.delivery_option === 'delivery' ? '🚚 Home Delivery' : '🏥 Pharmacy Pickup'}
                  </div>
                </div>
                <div className={styles.infoBlock}>
                  <div className={styles.infoRow}>💰 <strong>{parseFloat(req.total_amount || 0).toFixed(2)} ETB</strong></div>
                  {req.delivery_fee > 0 && <div className={styles.infoRow}>+ {req.delivery_fee} ETB delivery</div>}
                </div>
              </div>

              {req.rejection_reason && (
                <div className={styles.reasonBox}>
                  <AlertCircle size={14}/> Reason: {req.rejection_reason}
                </div>
              )}

              <div className={styles.cardActions}>
                {req.prescription_image && (
                  <a href={`/prescription-viewer?url=http://localhost:5000${req.prescription_image}`} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                    <Eye size={14}/> View Prescription
                  </a>
                )}
                {req.status === 'pending' && (
                  <>
                    <button className={styles.approveBtn} onClick={() => setApproveModal(req)}>✅ Approve</button>
                    <button className={styles.rejectBtn} onClick={() => { setRejectModal(req); setRejectReason(''); }}>❌ Reject</button>
                  </>
                )}
                {req.status === 'approved' && (
                  <button className={styles.readyBtn} onClick={() => handleMarkReady(req.id)}>📦 Mark as Ready</button>
                )}
                {req.status === 'ready_for_pickup' && (
                  <>
                    <button className={styles.approveBtn} onClick={() => handleMarkComplete(req.id, 'picked_up')}>✅ Picked Up</button>
                    <button className={styles.readyBtn} onClick={() => handleMarkComplete(req.id, 'delivered')}>🚚 Delivered</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className={styles.overlay} onClick={() => setApproveModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>✅ Approve Request {approveModal.request_number}</h3>
              <button className={styles.closeBtn} onClick={() => setApproveModal(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Medication:</strong> {approveModal.medication_name} × {approveModal.quantity}</p>
              <p><strong>Customer:</strong> {approveModal.customer_name}</p>
              <p><strong>Total:</strong> {parseFloat(approveModal.total_amount || 0).toFixed(2)} ETB</p>
              <div className={styles.stockNote}>
                Stock will be automatically deducted upon approval.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelModalBtn} onClick={() => setApproveModal(null)}>Cancel</button>
              <button className={styles.confirmApproveBtn} onClick={handleApprove} disabled={submitting}>
                {submitting ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className={styles.overlay} onClick={() => setRejectModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>❌ Reject Request {rejectModal.request_number}</h3>
              <button className={styles.closeBtn} onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Medication:</strong> {rejectModal.medication_name}</p>
              <p><strong>Reason for Rejection:</strong></p>
              <div className={styles.reasonOptions}>
                {REJECTION_REASONS.map(r => (
                  <label key={r} className={styles.reasonOption}>
                    <input type="radio" name="reason" value={r} checked={rejectReason === r}
                      onChange={() => setRejectReason(r)} />
                    {r}
                  </label>
                ))}
              </div>
              {rejectReason === 'Other' && (
                <input
                  className={styles.reasonInput}
                  placeholder="Specify reason..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                />
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelModalBtn} onClick={() => setRejectModal(null)}>Cancel</button>
              <button className={styles.confirmRejectBtn} onClick={handleReject} disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
