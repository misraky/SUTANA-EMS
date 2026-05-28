import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PrintingHome from './PrintingHome';
import OrderList from './OrderList';
import CreateOrder from './CreateOrder';
import OrderDetail from './OrderDetail';
import TaxReceiptPrint from './TaxReceiptPrint';
import styles from './PrintingDashboard.module.css';
const PrintingDashboard = () => {
  const menuItems = [
    { label: 'Production Summary', path: '/printing/overview', icon: 'monitor' },
    { label: 'Orders', path: '/printing/orders', icon: 'file-text' },
    { label: 'Tax Receipts', path: '/printing/receipts', icon: 'printer' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<PrintingHome />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="receipts" element={<TaxReceiptPrint />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};
export default PrintingDashboard;
