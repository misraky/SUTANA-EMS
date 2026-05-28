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
const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchOrderTrack = async () => {
      try {
        const res = await customerService.trackOrder(id);
        const o = res?.data?.order;
        if (o) {
          setOrder({
            ...o,
            productType: o.product_type || o.productType,
            dueDate: o.due_date || o.dueDate,
            createdAt: o.created_at || o.createdAt
          });
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
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  return (
    <div className={styles.container}>
      <button className={styles.btnBack} onClick={() => navigate('/customer/orders')}>
        ← Back to Orders
      </button>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Order #{order.id}</h1>
            <p className={styles.subtitle}>Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className={styles.statusBadge}>{order.status}</div>
        </div>
        <div className={styles.trackingWrapper}>
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <div key={step} className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}>
                <div className={styles.stepIcon}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className={styles.stepContent}>
                  <h3>{step}</h3>
                  {isCurrent && <p>Your order is currently here.</p>}
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.detailsGrid}>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Product Type</span>
            <span className={styles.detailValue}>{order.productType}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Quantity</span>
            <span className={styles.detailValue}>{order.quantity}</span>
          </div>
          <div className={styles.detailBox}>
            <span className={styles.detailLabel}>Estimated Due Date</span>
            <span className={styles.detailValue}>{formatDate(order.dueDate)}</span>
          </div>
        </div>
        {order.attachments && (
          <div className={styles.attachmentsSection} style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Attached Files</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {(typeof order.attachments === 'string' ? JSON.parse(order.attachments) : order.attachments).map((file, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📄 <span>{file.originalName || file.filename}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
