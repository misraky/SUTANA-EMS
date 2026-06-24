import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PharmacyPOS from './PharmacyPOS';
import PharmacyRequests from './PharmacyRequests';
import PharmacyProducts from './PharmacyProducts';
import CashierAuditLog from '../sales/CashierAuditLog';
import CustomerManagement from '../sales/CustomerManagement';

const PharmacyWorkerDashboard = () => {
  const menuItems = [
    { label: 'Walk-in POS',   path: '/pharmacy-worker/pos',      icon: 'shopping-cart' },
    { label: 'Online Orders', path: '/pharmacy-worker/orders',    icon: 'shopping-cart' },
    { label: 'Products',      path: '/pharmacy-worker/products',  icon: 'package' },
    { label: 'Customers',     path: '/pharmacy-worker/customers', icon: 'users' },
    { label: 'Audit Log',     path: '/pharmacy-worker/audit',     icon: 'archive' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Pharmacy Worker Dashboard">
      <Routes>
        <Route path="pos"       element={<PharmacyPOS />} />
        <Route path="orders"    element={<PharmacyRequests />} />
        <Route path="products"  element={<PharmacyProducts />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="audit"     element={<CashierAuditLog source="pharmacy" />} />
        <Route path="/"         element={<Navigate to="pos" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PharmacyWorkerDashboard;
