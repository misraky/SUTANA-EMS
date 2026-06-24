import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import customerService from '../../services/customerService';
import { formatDate } from '../../utils/formatters';
import styles from './OrderTracking.module.css';
import { ArrowLeft, Package, CheckCircle, Circle, Clock, Calendar, Phone, FileText, Truck } from 'lucide-react';

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
  const [loaded, setLoaded] = useState(false);

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
          setTimeout(() => setLoaded(true), 100);
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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid rgba(99,102,241,0.15)',
        borderTop: '3px solid #6366f1',
        borderRadius: '50%',
        animation: 'ospin 0.7s linear infinite',
        margin: '0 auto 20px'
      }} />
      <p style={{ fontWeight: 500 }}>Loading tracking details...</p>
      <style>{`@keyframes ospin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fef2f2, #fff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Package size={32} color="#dc2626" />
      </div>
      <p style={{ color: '#dc2626', fontWeight: 600, fontSize: 15 }}>{error}</p>
      <button onClick={() => navigate('/customer/orders')} style={{
        marginTop: 12, padding: '8px 20px', background: '#6366f1', color: 'white',
        border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
      }}>
        Back to Orders
      </button>
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
      <p>Order not found.</p>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={{
      maxWidth: 800, margin: '0 auto', padding: '1.5rem 2rem 3rem',
      fontFamily: "'Inter', sans-serif", color: '#111827',
    }}>
      {/* Back button */}
      <button onClick={() => navigate('/customer/orders')} style={{
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
        border: '1px solid #e2e8f0', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: '#6366f1', fontWeight: 600, fontSize: 13,
        padding: '8px 16px', borderRadius: 99, marginBottom: 20,
        transition: 'all 0.2s',
      }}>
        <ArrowLeft size={15} /> Back to Orders
      </button>

      {/* Main card */}
      <div style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderRadius: 24, border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 8px 40px rgba(99,102,241,0.06), 0 1px 2px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(255,255,255,0.9) 100%)',
          borderBottom: '1px solid rgba(226,232,240,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 99,
                background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                marginBottom: 8, textTransform: 'uppercase',
              }}>
                <Package size={12} /> Printing Order
              </div>
              <h1 style={{
                margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Order #{order.id}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <span style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
            }}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Tracking timeline */}
        <div style={{ padding: '32px 28px 20px' }}>
          <div style={{ position: 'relative', paddingLeft: 0 }}>
            {/* Progress line */}
            <div style={{
              position: 'absolute', left: 19, top: 0, bottom: 0,
              width: 2, background: '#e5e7eb', zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', left: 19, top: 0,
              width: 2, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
              zIndex: 1,
              height: `${((currentStepIndex + 1) / STATUS_STEPS.length) * 100}%`,
              transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />

            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  position: 'relative', zIndex: 2, marginBottom: index < STATUS_STEPS.length - 1 ? 28 : 0,
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s ease ${index * 0.12}s`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: isCompleted
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : isCurrent
                        ? 'white'
                        : '#f1f5f9',
                    border: isCurrent ? '2px solid #6366f1' : 'none',
                    color: isCompleted ? 'white' : isCurrent ? '#6366f1' : '#9ca3af',
                    fontSize: 14, fontWeight: 700,
                    boxShadow: isCompleted
                      ? '0 4px 16px rgba(99,102,241,0.3)'
                      : isCurrent
                        ? '0 0 0 4px rgba(99,102,241,0.15)'
                        : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {isCompleted ? <CheckCircle size={18} /> : isCurrent ? <Truck size={16} /> : index + 1}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <h3 style={{
                      margin: '0 0 2px', fontSize: 15, fontWeight: 700,
                      color: isCompleted || isCurrent ? '#111827' : '#9ca3af',
                      transition: 'color 0.3s',
                    }}>
                      {step}
                    </h3>
                    {isCurrent && (
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: 500,
                        color: '#6366f1',
                      }}>
                        Your order is currently here.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status summary */}
          <div style={{
            textAlign: 'center', marginTop: 24, marginBottom: 8,
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))',
            borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#6366f1',
            border: '1px solid rgba(99,102,241,0.1)',
          }}>
            <Truck size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {order.status === 'Delivered'
              ? 'Your order has been delivered successfully!'
              : order.status === 'Ready'
                ? 'Your order is ready for pickup.'
                : `Current status: ${order.status}`}
          </div>
        </div>

        {/* Details */}
        <div style={{
          padding: '0 28px 24px',
        }}>
          <h3 style={{
            fontSize: 13, fontWeight: 700, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            margin: '0 0 12px',
          }}>
            Order Details
          </h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}>
            <DetailBox
              icon={<Package size={14} />}
              label="Product Type"
              value={order.productType || '-'}
            />
            <DetailBox
              icon={<FileText size={14} />}
              label="Quantity"
              value={order.quantity || '-'}
            />
            <DetailBox
              icon={<Phone size={14} />}
              label="Phone"
              value={order.customer_phone || order.user_phone || 'N/A'}
            />
            <DetailBox
              icon={<Calendar size={14} />}
              label="Estimated Due Date"
              value={formatDate(order.dueDate) || '-'}
            />
          </div>
        </div>

        {/* Attachments */}
        {order.attachments && (() => {
          const files = typeof order.attachments === 'string' ? JSON.parse(order.attachments) : order.attachments;
          return files.length > 0 ? (
            <div style={{
              padding: '20px 28px',
              borderTop: '1px solid rgba(226,232,240,0.4)',
              background: 'rgba(248,250,252,0.5)',
            }}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <FileText size={14} /> Attached Files
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', background: 'white',
                    borderRadius: 10, border: '1px solid #e2e8f0',
                    fontSize: 13,
                  }}>
                    <FileText size={16} color="#6366f1" />
                    <span style={{ flex: 1, fontWeight: 500, color: '#1e293b' }}>
                      {file.originalName || file.filename}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Footer */}
        <div style={{
          padding: '14px 28px',
          borderTop: '1px solid rgba(226,232,240,0.4)',
          background: 'rgba(248,250,252,0.8)',
          fontSize: 13, color: '#64748b',
          display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
        }}>
          <Clock size={14} /> Need help? Contact support at <strong>011-123-4567</strong>
        </div>
      </div>
    </div>
  );
};

const DetailBox = ({ icon, label, value }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '12px 14px', borderRadius: 12,
    background: '#f8fafc', border: '1px solid #f1f5f9',
  }}>
    <span style={{
      fontSize: 10, fontWeight: 600, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {icon} {label}
    </span>
    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
      {value}
    </span>
  </div>
);

export default OrderTracking;
