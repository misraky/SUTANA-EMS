import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SalesHome from './SalesHome';
import POSPage from './POSPage';
import CustomerManagement from './CustomerManagement';
import SalesReports from './SalesReports';
const SalesDashboard = () => {
  const menuItems = [
    { label: 'Sales Overview', path: '/sales/overview', icon: 'bar-chart' },
    { label: 'Point of Sale', path: '/sales/pos', icon: 'shopping-cart' },
    { label: 'Customers', path: '/sales/customers', icon: 'users' },
    { label: 'Sales Reports', path: '/sales/reports', icon: 'file-text' },
  ];
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          <Route path="overview" element={<SalesHome />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="reports" element={<SalesReports />} />
          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};
export default SalesDashboard;
