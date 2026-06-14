import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RetailPos from './RetailPos';
import RetailInventory from './RetailInventory';
import RetailManagerDashboard from './RetailManagerDashboard';
import RetailFinance from './RetailFinance';

const RetailDashboard = () => {
  const menuItems = [
    { label: 'Manager Dashboard', path: '/retail/manager', icon: 'bar-chart' },
    { label: 'POS / Checkout',    path: '/retail/pos',      icon: 'shopping-cart' },
    { label: 'Inventory',         path: '/retail/inventory',icon: 'box' },
    { label: 'Finance',           path: '/retail/finance',  icon: 'wallet' },
  ];

  return (
    <DashboardLayout menuItems={menuItems}>
      <Routes>
        <Route path="manager"   element={<RetailManagerDashboard />} />
        <Route path="pos"       element={<RetailPos />} />
        <Route path="inventory" element={<RetailInventory />} />
        <Route path="finance"   element={<RetailFinance />} />
        <Route path="/"         element={<Navigate to="manager" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default RetailDashboard;
