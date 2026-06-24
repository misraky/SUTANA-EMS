import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import customerService from '../../services/customerService';
import { formatDate } from '../../utils/formatters';
import styles from './OrderTracking.module.css';

const STATUS_STEPS = [
  'Received',
  'In Progress',
  'Quality Check',
  'Ready',
  'Delivered'
];

const parseAttachments = (val) => {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  if (Array.isArray(val)) return val;
  return [];
};

const safeFileSize = (file) => {
  if (!file || file.size == null) return '';
  const mb = Number(file.size) / 1024 / 1024;
  return isNaN(mb) ? '' : `(${mb.toFixed(2)} MB)`;
};

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchOrderTrack = async () => {
      try {
        const res = await customerService.trackOrder(id);
        const { order: o, timeline: t } = res?.data?.data || {};
        if (o) {
          setOrder({
            ...o,
            productType: o.product_type || o.productType,
            dueDate: o.due_date || o.dueDate,
            createdAt: o.created_at || o.createdAt,
          });
          setTimeline(t || []);
        } else {
          setError('Order not found.');
        }
      } catch (err) {
        setError('Failed to track order or order not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderTrack();
  }, [id]);
  if (loading) return <div className={styles.centerState}>Loading tracking details...</div>;
  if (error) return <div className={styles.errorState}>{error}</div>;
  if (!order) return <div className={styles.centerState}>Order not found.</div>;
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const currentStepIndex = stepIndex >= 0 ? stepIndex : -1;
  return (
    <div className={styles.container}>
      <button className={styles.btnBack} onClick={() => navigate('/customer/orders')}>
        ← Back to Orders
      </button>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Order {order.order_number ? `#${order.order_number}` : `#${id}`}</h1>
            <p className={styles.subtitle}>Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className={styles.statusBadge} style={order.status_color ? { background: order.status_color } : {}}>
            {order.status || 'Unknown'}
          </div>
        </div>
        <div className={styles.trackingWrapper}>
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = currentStepIndex >= 0 && index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <div key={`${step}-${index}`} className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}>
                <div className={styles.stepIcon}>
                  {isCompleted ? '\u2713' : index + 1}
                </div>
                <div className={styles.stepContent}>
                  <h3>{step}</h3>
                  {isCurrent && <p>Your order is currently here.</p>}
                </div>
              </div>
            );
          })}
        </div>
        {timeline.length > 0 && (
          <div className={styles.timelineSection} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>Status History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {timeline.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, color: '#111827' }}>{entry.status}</span>
                  <span style={{ color: '#9ca3af' }}>{entry.changed_at ? formatDate(entry.changed_at) : ''}</span>
                  {entry.note && <span style={{ color: '#6b7280', fontStyle: 'italic' }}>&mdash; {entry.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={styles.detailsGrid}>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Product Type</span>
            <span className={styles.detailValue}>{order.productType || '-'}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Quantity</span>
            <span className={styles.detailValue}>{order.quantity || '-'}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Estimated Due Date</span>
            <span className={styles.detailValue}>{order.dueDate ? formatDate(order.dueDate) : '-'}</span>
          </div>
        </div>
        {parseAttachments(order.attachments).length > 0 && (
          <div className={styles.attachmentsSection} style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Attached Files</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {parseAttachments(order.attachments).map((file, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {'\uD83D\uDCC4'} <span>{file.originalName || file.filename}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {safeFileSize(file)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrderTracking;