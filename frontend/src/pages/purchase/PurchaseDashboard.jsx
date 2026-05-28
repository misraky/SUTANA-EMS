import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PurchaseHome from './PurchaseHome';
import SupplierList from './SupplierList';
import CreateSupplier from './CreateSupplier';
import PurchaseOrderList from './PurchaseOrderList';
import CreatePurchaseOrder from './CreatePurchaseOrder';
import PurchaseOrderDetail from './PurchaseOrderDetail';
import Receiving from './Receiving';
import styles from './PurchaseDashboard.module.css';
const PurchaseDashboard = () => {
  const menuItems = [
    { label: 'Purchasing Summary', path: '/purchase/overview', icon: 'truck' },
    { label: 'Suppliers', path: '/purchase/suppliers', icon: 'briefcase' },
    { label: 'Purchase Orders', path: '/purchase/orders', icon: 'file-plus' },
    { label: 'Receiving', path: '/purchase/receiving', icon: 'package' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          <Route path="overview" element={<PurchaseHome />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="suppliers/create" element={<CreateSupplier />} />
          <Route path="orders" element={<PurchaseOrderList />} />
          <Route path="orders/create" element={<CreatePurchaseOrder />} />
          <Route path="orders/:id" element={<PurchaseOrderDetail />} />
          <Route path="receiving" element={<Receiving />} />
          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};
export default PurchaseDashboard;
