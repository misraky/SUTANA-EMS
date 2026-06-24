import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FarmingOverview from './FarmingOverview';
import FarmingProducts from './FarmingProducts';
import FarmingFinanceReport from './FarmingFinanceReport';
import FarmingQuickLinks from './FarmingQuickLinks';
import FarmingReorderRequest from './FarmingReorderRequest';
import FarmingShiftReports from './FarmingShiftReports';
import FarmingCropCalendar from './FarmingCropCalendar';
import FarmingStoreRequest from './FarmingStoreRequest';

const FarmingManagerDashboard = () => {
  const menuItems = [
    { label: 'Overview',     path: '/farming-manager/overview',  icon: 'bar-chart-2' },
    { label: 'Quick Link',   path: '/farming-manager/quick-links', icon: 'zap' },
    { label: 'Products',     path: '/farming-manager/products',  icon: 'shopping-bag' },
    { label: 'Finance Reports', path: '/farming-manager/finance', icon: 'file-text' },
    { label: 'Store Request',  path: '/farming-manager/store-request', icon: 'shopping-cart' }
  ];

  return (
      <DashboardLayout menuItems={menuItems} title="Farming Manager Dashboard">
      <Routes>
        <Route path="overview" element={<FarmingOverview />} />
        <Route path="quick-links" element={<FarmingQuickLinks />} />
        <Route path="products" element={<FarmingProducts />} />
        <Route path="finance"  element={<FarmingFinanceReport />} />
        <Route path="stock-report" element={<Navigate to="../quick-links" replace />} />
        <Route path="workers" element={<Navigate to="../quick-links" replace />} />
        <Route path="daily-report" element={<Navigate to="../quick-links" replace />} />
        <Route path="expense-ledger" element={<Navigate to="../quick-links" replace />} />
        <Route path="reorder-request" element={<FarmingReorderRequest />} />
        <Route path="shift-reports" element={<FarmingShiftReports />} />
        <Route path="crop-calendar" element={<FarmingCropCalendar />} />
        <Route path="store-request" element={<FarmingStoreRequest />} />
        <Route path="/"        element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default FarmingManagerDashboard;
