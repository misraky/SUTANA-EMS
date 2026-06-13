import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import styles from './CustomerPrescriptions.module.css';
import { ClipboardList, Clock, CheckCircle, XCircle, Package, RefreshCw, Eye } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={14} />, border: '#fcd34d' },
  approved: { label: 'Approved', color: '#3b82f6', bg: '#eff6ff', icon: <CheckCircle size={14} />, border: '#93c5fd' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={14} />, border: '#fca5a5' },
  ready_for_pickup: { label: 'Ready for Pickup 📦', color: '#10b981', bg: '#f0fdf4', icon: <Package size={14} />, border: '#6ee7b7' },
  picked_up: { label: 'Picked Up ✅', color: '#6b7280', bg: '#f9fafb', icon: <CheckCircle size={14} />, border: '#d1d5db' },
  delivered: { label: 'Delivered ✅', color: '#6b7280', bg: '#f9fafb', icon: <CheckCircle size={14} />, border: '#d1d5db' },
};

export default function CustomerPrescriptions() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get('/pharmacy/requests/my-requests');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load prescription requests', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await axios.delete(`/pharmacy/requests/${id}/cancel`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}><ClipboardList size={24}/> My Prescription Requests</div>
        <div className={styles.skeletonGrid}>
          {[1,2,3].map(i => <div key={i} className={styles.skeleton}/>)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ClipboardList size={24} color="#10b981"/>
          <h2>My Prescription Requests</h2>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={fetchRequests}><RefreshCw size={16}/> Refresh</button>
          <button className={styles.newBtn} onClick={() => navigate('/services/pharmacy')}>+ New Request</button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={64} color="#d1d5db"/>
          <p>No prescription requests yet.</p>
          <button className={styles.newBtn} onClick={() => navigate('/services/pharmacy')}>Browse Medications</button>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            return (
              <div
                key={req.id}
                className={styles.requestCard}
                style={{ borderLeft: `4px solid ${cfg.border}` }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.requestNum}>#{req.request_number}</div>
                  <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                <div className={styles.cardMid}>
                  <div className={styles.medInfo}>
                    <span className={styles.medName}>{req.medication_name}</span>
                    <span className={styles.medQty}>Qty: {req.quantity}</span>
                  </div>
                  <div className={styles.meta}>
                    <span>💊 {req.delivery_option === 'delivery' ? '🚚 Home Delivery' : '🏥 Pickup'}</span>
                    <span>💰 {parseFloat(req.total_amount || 0).toFixed(2)} ETB</span>
                    <span>🕐 {new Date(req.requested_at).toLocaleString()}</span>
                  </div>
                  {req.status === 'rejected' && req.rejection_reason && (
                    <div className={styles.rejectionBox}>
                      ❌ Rejection Reason: <strong>{req.rejection_reason}</strong>
                    </div>
                  )}
                  {req.status === 'ready_for_pickup' && (
                    <div className={styles.readyBox}>
                      📦 Your medication is ready! Please visit the pharmacy to collect it.
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  {req.prescription_image && (
                    <a
                      href={`/prescription-viewer?url=http://localhost:5000${req.prescription_image}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.viewBtn}
                    >
                      <Eye size={14}/> View Prescription
                    </a>
                  )}
                  {req.status === 'pending' && (
                    <button className={styles.cancelBtn} onClick={() => handleCancel(req.id)}>
                      Cancel Request
                    </button>
                  )}
                  {req.status === 'rejected' && (
                    <button className={styles.newBtn} onClick={() => navigate('/services/pharmacy')}>
                      Submit New Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
