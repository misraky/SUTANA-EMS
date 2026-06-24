import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PrintingOrders from './PrintingOrders';
import PrintingCreateOrder from './PrintingCreateOrder';
import PrintingOrderDetail from './PrintingOrderDetail';
import PrintingPOS from './PrintingPOS';
import CustomerManagement from '../sales/CustomerManagement';

const PrintingWorkerDashboard = () => {
  const menuItems = [
    { label: 'POS / Payments',   path: '/printing-worker/pos',          icon: 'cart' },
    { label: 'All Orders',       path: '/printing-worker/orders',       icon: 'list' },
    { label: 'New Order',        path: '/printing-worker/create-order', icon: 'file-plus' },
    { label: 'Customers',        path: '/printing-worker/customers',    icon: 'users' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Printing Worker">
      <Routes>
        <Route path="pos"            element={<PrintingPOS />} />
        <Route path="orders"         element={<PrintingOrders />} />
        <Route path="create-order"   element={<PrintingCreateOrder />} />
        <Route path="orders/:id"     element={<PrintingOrderDetail />} />
        <Route path="customers"      element={<CustomerManagement />} />
        
        {/* Default route redirect */}
        <Route path="/" element={<Navigate to="pos" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PrintingWorkerDashboard;

