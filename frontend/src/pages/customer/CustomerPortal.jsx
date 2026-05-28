import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CustomerOrders from './CustomerOrders';
import CustomerOrderForm from './CustomerOrderForm';
import OrderTracking from './OrderTracking';
import CustomerReceipts from './CustomerReceipts';
import CustomerProfile from './CustomerProfile';
import CustomerInvoices from './CustomerInvoices';
import SupportTickets from './SupportTickets';
import styles from './CustomerPortal.module.css';
import customerService from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
const CustomerPortalHome = () => {
  const [balance, setBalance] = React.useState(0);
  const [notifications, setNotifications] = React.useState([]);
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const balRes = await customerService.getBalance();
        setBalance(balRes?.data?.data?.currentBalance || 0);
        const notifRes = await customerService.getNotifications({ unreadOnly: true });
        setNotifications(notifRes?.data?.data?.notifications || []);
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
          <h3>Unread Notifications</h3>
          <p>{notifications.length}</p>
        </div>
      </div>
    </div>
  );
};
const CustomerPortal = () => {
  const menuItems = [
    { label: 'Portal Home', path: '/customer/portal', icon: 'home' },
    { label: 'My Orders', path: '/customer/orders', icon: 'package' },
    { label: 'Place Order', path: '/customer/new-order', icon: 'plus-circle' },
    { label: 'Receipts', path: '/customer/receipts', icon: 'file-text' },
    { label: 'Invoices', path: '/customer/invoices', icon: 'credit-card' },
    { label: 'Support', path: '/customer/support', icon: 'message-circle' },
    { label: 'My Profile', path: '/customer/profile', icon: 'user' },
  ];
  return (
    <div className={styles.portalWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          <Route path="portal" element={<CustomerPortalHome />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="orders/:id/track" element={<OrderTracking />} />
          <Route path="new-order" element={<CustomerOrderForm />} />
          <Route path="receipts" element={<CustomerReceipts />} />
          <Route path="invoices" element={<CustomerInvoices />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="/" element={<Navigate to="portal" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};
export default CustomerPortal;
