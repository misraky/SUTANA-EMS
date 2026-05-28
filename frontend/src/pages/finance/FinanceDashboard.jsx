import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FinanceHome from './FinanceHome';
import PaymentTracking from './PaymentTracking';
import ExpenseManagement from './ExpenseManagement';
import FinancialReports from './FinancialReports';
import styles from './FinanceDashboard.module.css';
const FinanceDashboard = () => {
  const menuItems = [
    { label: 'Financial Summary', path: '/finance/overview', icon: 'wallet' },
    { label: 'Payment Tracking',  path: '/finance/payments', icon: 'credit-card' },
    { label: 'Expense Management',path: '/finance/expenses', icon: 'shopping-cart' },
    { label: 'Financial Reports', path: '/finance/reports', icon: 'bar-chart' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<FinanceHome />} />
            <Route path="payments" element={<PaymentTracking />} />
            <Route path="expenses" element={<ExpenseManagement />} />
            <Route path="reports"  element={<FinancialReports />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};
export default FinanceDashboard;
