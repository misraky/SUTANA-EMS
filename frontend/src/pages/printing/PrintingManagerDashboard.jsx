import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PrintingOverview from './PrintingOverview';
import PrintingOrders from './PrintingOrders';
import PrintingCreateOrder from './PrintingCreateOrder';
import PrintingOrderDetail from './PrintingOrderDetail';
import PrintingTaxReceipts from './PrintingTaxReceipts';

const PrintingManagerDashboard = () => {
  const menuItems = [
    { label: 'Overview',         path: '/printing-manager/overview',     icon: 'bar-chart' },
    { label: 'All Orders',       path: '/printing-manager/orders',       icon: 'list' },
    { label: 'New Order',        path: '/printing-manager/create-order', icon: 'file-plus' },
    { label: 'Tax Receipts',     path: '/printing-manager/tax-receipts', icon: 'receipt' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Printing Sales">
      <Routes>
        <Route path="overview"        element={<PrintingOverview />} />
        <Route path="orders"          element={<PrintingOrders />} />
        <Route path="orders/:id"      element={<PrintingOrderDetail />} />
        <Route path="create-order"    element={<PrintingCreateOrder />} />
        <Route path="tax-receipts"    element={<PrintingTaxReceipts />} />
        <Route path="/"               element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PrintingManagerDashboard;
