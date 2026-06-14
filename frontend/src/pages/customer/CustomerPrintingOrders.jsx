import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Printer, Clock, CheckCircle } from 'lucide-react';
import styles from './CustomerPortal.module.css';

const CustomerPrintingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/printing/customer/orders');
        if (res.status === 'success') setOrders(res.data?.orders || []);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statusIcon = (code) => {
    if (code === 'delivered') return <CheckCircle size={18} color="#10b981" />;
    if (code === 'ready') return <CheckCircle size={18} color="#3b82f6" />;
    return <Clock size={18} color="#f59e0b" />;
  };

  if (loading) return <div className={styles.loadingContainer}>Loading orders...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>My Printing Orders</h1>
        <p>Track your printing jobs and deliveries.</p>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <Printer size={48} className={styles.emptyIcon} />
          <p>You have no printing orders yet.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderCardHeader}>
                <div>
                  <h3 className={styles.orderId}>Order #{order.order_number}</h3>
                  <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: order.status_code === 'delivered' ? '#ecfdf5' : '#fffbeb', color: order.status_code === 'delivered' ? '#059669' : '#d97706' }}>
                  {statusIcon(order.status_code)} {order.status_name}
                </div>
              </div>
              <div className={styles.orderDetailsGrid}>
                <div><strong>Product:</strong> {order.product_type}</div>
                <div><strong>Paper:</strong> {order.paper_type}</div>
                <div><strong>Pages:</strong> {order.pages_per_copy} × {order.quantity}</div>
                <div><strong>Binding:</strong> {order.binding_type || 'None'}</div>
                <div><strong>Total:</strong> {parseFloat(order.total_price).toLocaleString()} ETB</div>
                {order.due_date && <div><strong>Due:</strong> {new Date(order.due_date).toLocaleDateString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerPrintingOrders;
