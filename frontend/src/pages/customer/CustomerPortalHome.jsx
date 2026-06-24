import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import customerService from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, Package } from 'lucide-react';
import styles from './CustomerPortal.module.css';

const statusIcons = { COMPLETED: '\u2705', DELIVERED: '\u2705', OUT_FOR_DELIVERY: '\uD83D\uDE9A', READY_FOR_PICKUP: '\uD83D\uDCE6', default: '\u23F3' };

const CustomerPortalHome = ({ onPlaceOrder }) => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, notifRes, farmRes, printRes, retailRes, rentalRes] = await Promise.all([
          customerService.getBalance(),
          customerService.getNotifications({ unreadOnly: true }),
          apiClient.get('/farming/orders/my-orders').catch(() => ({ status: 'error', data: [] })),
          apiClient.get('/printing/customer/orders').catch(() => ({ status: 'error', data: { orders: [] } })),
          apiClient.get('/retail/orders/my-orders').catch(() => ({ status: 'error', data: [] })),
          apiClient.get('/rental-orders/my-orders').catch(() => ({ status: 'error', data: [] })),
        ]);
        setBalance(balRes?.data?.currentBalance || 0);
        setNotifications(notifRes?.data?.notifications || []);
        const farming = farmRes.status === 'success' ? farmRes.data.slice(0, 3) : [];
        const printing = printRes.status === 'success' ? (printRes.data?.orders || []).slice(0, 3) : [];
        const retail = retailRes.status === 'success' ? (retailRes.data || []).slice(0, 3) : [];
        const rentals = rentalRes.status === 'success' ? (rentalRes.data || []).slice(0, 3) : [];
        const all = [...farming.map(o => ({ ...o, type: 'Farming', id: `farm-${o.id}` })),
                     ...printing.map(o => ({ ...o, type: 'Printing', id: `prt-${o.id}`, invoice_number: o.order_number })),
                     ...retail.map(o => ({ ...o, type: 'Retail', id: `ret-${o.id}`, invoice_number: o.invoice_number, total_amount: o.total_amount })),
                     ...rentals.map(o => ({ ...o, type: 'Car Rental', id: `rent-${o.id}`, invoice_number: o.orderNumber, total_amount: o.totalAmount }))];
        setRecentOrders(all.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch portal data', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.welcomeText}>Welcome to your Portal</h1>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Current Balance</h3>
          <p className={balance > 0 ? styles.textRed : styles.textGreen}>
            {formatCurrency(balance)}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Notifications</h3>
          <p>{notifications.length} unread</p>
        </div>
      </div>

      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2>Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onPlaceOrder} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: 'white',
            border: 'none', padding: '12px 22px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
            <ShoppingCart size={18} /> Place New Order
          </button>
          <button onClick={() => navigate('/customer/all-orders')} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', color: '#475569',
            border: '1px solid #e2e8f0', padding: '12px 22px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13
          }}>
            <Package size={18} /> View All Orders
          </button>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2>Recent Orders</h2>
            <button onClick={() => navigate('/customer/all-orders')} className={styles.viewAllBtn}>View All</button>
          </div>
          <div className={styles.ordersGrid}>
            {recentOrders.map(order => (
              <div key={order.id} className={styles.dashOrderCard}>
                <div className={styles.dashOrderTop}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: order.type === 'Farming' ? '#059669' : order.type === 'Retail' ? '#d97706' : '#3b82f6', background: order.type === 'Farming' ? '#ecfdf5' : order.type === 'Retail' ? '#fffbeb' : '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>
                    {order.type}
                  </span>
                  <span className={styles.dashOrderStatus}>{statusIcons[order.status] || statusIcons.default}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {order.invoice_number || order.order_number}
                </div>
                <div className={styles.dashOrderBottom}>
                  <span className={styles.dashOrderAmount}>{order.total_amount || order.total_price} ETB</span>
                  <span className={styles.dashOrderDate}>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortalHome;
