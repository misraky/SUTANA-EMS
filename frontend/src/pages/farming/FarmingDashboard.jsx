import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FarmingPOS from './FarmingPOS';
import FarmingOrders from './FarmingOrders';
import FarmingFinanceReport from './FarmingFinanceReport';
import FarmingProducts from './FarmingProducts';
import FarmingOverview from './FarmingOverview';

const FarmingDashboard = () => {
  const menuItems = [
    { label: 'Overview',         path: '/farming/overview',        icon: 'bar-chart-2' },
    { label: 'Walk-in POS',      path: '/farming/pos',             icon: 'shopping-cart' },
    { label: 'Online Orders',    path: '/farming/orders',          icon: 'package' },
    { label: 'Products & Stock', path: '/farming/products',        icon: 'layers' },
    { label: 'Finance Handover', path: '/farming/finance-report',  icon: 'file-text' },
  ];

  return (
    <DashboardLayout menuItems={menuItems}>
      <Routes>
        <Route path="overview"        element={<FarmingOverview />} />
        <Route path="pos"             element={<FarmingPOS />} />
        <Route path="orders"          element={<FarmingOrders />} />
        <Route path="products"        element={<FarmingProducts />} />
        <Route path="finance-report"  element={<FarmingFinanceReport />} />
        <Route path="/"               element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default FarmingDashboard;
