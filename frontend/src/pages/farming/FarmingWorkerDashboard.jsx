import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FarmingPOS from './FarmingPOS';
import FarmingProducts from './FarmingProducts';
import CashierAuditLog from '../sales/CashierAuditLog';

const FarmingWorkerDashboard = () => {
  const menuItems = [
    { label: 'POS',           path: '/farming-worker/pos',       icon: 'shopping-cart' },
    { label: 'Products',      path: '/farming-worker/products',  icon: 'package' },
    { label: 'Audit Log',     path: '/farming-worker/audit',     icon: 'archive' },
    { label: 'History',       path: '/farming-worker/history',   icon: 'bar-chart-2' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Farming Worker Dashboard">
      <Routes>
        <Route path="pos"       element={<FarmingPOS />} />
        <Route path="products"  element={<FarmingProducts />} />
        <Route path="audit"     element={<CashierAuditLog source="farming" currentShiftOnly />} />
        <Route path="history"   element={<CashierAuditLog source="farming" />} />
        <Route path="/"         element={<Navigate to="pos" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default FarmingWorkerDashboard;
