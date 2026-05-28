import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import printingService from '../../services/printingService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import styles from './OrderDetail.module.css';
const STATUS_PIPELINE = [
  { code: 'received',      label: 'Received' },
  { code: 'in_progress',   label: 'In Progress' },
  { code: 'quality_check', label: 'Quality Check' },
  { code: 'ready',         label: 'Ready' },
  { code: 'delivered',     label: 'Delivered' },
];
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMsg, setStatusMsg]       = useState(null);
  useEffect(() => { fetchOrderDetails(); }, [id]);
  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await printingService.getOrderById(id);
      setOrder(response.data?.order || response.data || null);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details. It may not exist.');
    } finally {
      setLoading(false);
    }
  };
  const handleStatusUpdate = async (statusCode) => {
    const currentCode = order.status_code || order.status;
    if (statusCode === currentCode) return;
    setStatusUpdating(true);
    setStatusMsg(null);
    try {
      await printingService.updateOrderStatus(id, statusCode);
      setStatusMsg({ type: 'success', text: `Status updated to ${STATUS_PIPELINE.find(s => s.code === statusCode)?.label}` });
      await fetchOrderDetails();
    } catch (err) {
      console.error('Failed to update status:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update order status' });
    } finally {
      setStatusUpdating(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading order details...</p>
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className={styles.errorState}>
        <p>{error || 'Order not found.'}</p>
        <button onClick={() => navigate('/printing/orders')} className={styles.backBtn}>
          Back to Orders
        </button>
      </div>
    );
  }
  const currentStatusCode = order.status_code || order.status || 'received';
  const currentStatusIndex = STATUS_PIPELINE.findIndex(s => s.code === currentStatusCode);
  const isPastDue = order.due_date && new Date(order.due_date) < new Date() && currentStatusCode !== 'delivered';
  const totalImpressions = (order.pages_per_copy || 0) * (order.quantity || 0);
  return (
    <div className={styles.container}>
      {}
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <button className={styles.backBtn} onClick={() => navigate('/printing/orders')}>
            ← Back
          </button>
          <div>
            <h1 className={styles.title}>
              {order.order_number || `PRT-${order.id}`}
            </h1>
            <p className={styles.subtitle}>
              Created on {formatDate(order.created_at, 'datetime')}
            </p>
          </div>
        </div>
        <button
          className={styles.printReceiptBtn}
          onClick={() => navigate(`/printing/receipts?orderId=${order.id}`)}
        >
          🖨️ Tax Receipt
        </button>
      </div>
      {}
      {statusMsg && (
        <div className={`${styles.statusAlert} ${styles[statusMsg.type]}`}>
          {statusMsg.text}
        </div>
      )}
      {}
      {isPastDue && (
        <div className={styles.overdueAlert}>
          🔴 <strong>PAST DUE</strong> — This order was due on {formatDate(order.due_date, 'short')}
        </div>
      )}
      <div className={styles.layout}>
        {}
        <div className={styles.mainContent}>
          {}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Production Status</h2>
            <div className={styles.statusPipeline}>
              {STATUS_PIPELINE.map((step, index) => {
                const isActive = index === currentStatusIndex;
                const isPast   = index <  currentStatusIndex;
                return (
                  <div key={step.code} className={styles.statusStep}>
                    <button
                      className={`${styles.statusNode} ${isActive ? styles.activeNode : ''} ${isPast ? styles.pastNode : ''}`}
                      onClick={() => handleStatusUpdate(step.code)}
                      disabled={statusUpdating || isPast}
                      title={`Set status to ${step.label}`}
                    >
                      {isActive ? <div className={styles.activeDot} /> : (isPast ? '✓' : '')}
                    </button>
                    <span className={`${styles.statusLabel} ${isActive ? styles.activeLabel : ''}`}>
                      {step.label}
                    </span>
                    {index < STATUS_PIPELINE.length - 1 && (
                      <div className={`${styles.statusLine} ${isPast || isActive ? styles.pastLine : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {statusUpdating && <p className={styles.updatingText}>⏳ Updating status...</p>}
          </div>
          {/* Customer + Specs grid */}
          <div className={styles.grid}>
            {/* Customer Info */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Customer Information</h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Name</span>
                  <span className={styles.value}>{order.customer_name || 'Walk-in Customer'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Phone</span>
                  <span className={styles.value}>{order.customer_phone || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Created By</span>
                  <span className={styles.value}>{order.created_by_name || '—'}</span>
                </div>
              </div>
            </div>
            {}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Printing Specifications</h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Product Type</span>
                  <span className={styles.value}>{order.product_type || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Paper Size</span>
                  <span className={styles.value}>{order.paper_type || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Pages per Copy</span>
                  <span className={styles.value}>{order.pages_per_copy ?? '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Color Printing</span>
                  <span className={styles.value}>{order.color_printing ? 'Full Color' : 'Black & White'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Binding</span>
                  <span className={styles.value}>{order.binding_type || 'None'}</span>
                </div>
              </div>
            </div>
          </div>
          {}
          {order.special_instructions && (
            <div className={`${styles.card} ${styles.notesCard}`}>
              <h2 className={styles.cardTitle}>Special Instructions</h2>
              <p className={styles.notesText}>{order.special_instructions}</p>
            </div>
          )}
          {}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Attachments & Files</h2>
            {order.attachments ? (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                {(typeof order.attachments === 'string' ? JSON.parse(order.attachments) : order.attachments).map((file, idx) => {
                  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
                  return (
                    <li key={idx} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📄 <span style={{ fontWeight: '500', color: '#111827' }}>{file.originalName || file.filename}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <a
                        href={`${baseUrl}/uploads/orders/${file.filename}`}
                        download={file.originalName || file.filename}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#0284c7', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '500' }}
                      >
                        Download
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ marginTop: '1rem', color: '#6b7280', fontStyle: 'italic' }}>
                No files uploaded. The customer opted to bring the files physically.
              </p>
            )}
          </div>
        </div>
        {}
        <div className={styles.sidebar}>
          <div className={styles.summaryCard}>
            <h2 className={styles.cardTitle}>Production Summary</h2>
            <div className={styles.metricGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Quantity (Copies)</span>
                <span className={styles.metricValue}>{(order.quantity || 0).toLocaleString()}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Pages per Copy</span>
                <span className={styles.metricValue}>{order.pages_per_copy ?? '—'}</span>
              </div>
            </div>
            <div className={styles.totalMetric}>
              <span className={styles.metricLabel}>Total Impressions</span>
              <span className={styles.totalValue}>{totalImpressions.toLocaleString()}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.metricGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Unit Price</span>
                <span className={styles.metricValue}>{formatCurrency(order.price_per_unit)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Binding Cost</span>
                <span className={styles.metricValue}>{formatCurrency(order.binding_cost)}</span>
              </div>
            </div>
            <div className={styles.totalMetric} style={{ marginTop: '0.75rem' }}>
              <span className={styles.metricLabel}>Total Price</span>
              <span className={styles.totalValue} style={{ color: '#059669' }}>
                {formatCurrency(order.total_price)}
              </span>
            </div>
            <div className={styles.divider} />
            <div className={styles.dateInfo}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Due Date</span>
                <span className={`${styles.value} ${isPastDue ? styles.overdue : ''}`}>
                  {formatDate(order.due_date, 'short')}
                  {isPastDue && ' ⚠️'}
                </span>
              </div>
              {order.completed_at && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Completed</span>
                  <span className={styles.value}>{formatDate(order.completed_at, 'short')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrderDetail;
