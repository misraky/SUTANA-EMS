import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PurchaseHome from './PurchaseHome';
import SupplierList from './SupplierList';
import SupplierProfile from './SupplierProfile';
import CreateSupplier from './CreateSupplier';
import PurchaseOrderList from './PurchaseOrderList';
import CreatePurchaseOrder from './CreatePurchaseOrder';
import PurchaseOrderDetail from './PurchaseOrderDetail';
import Receiving from './Receiving';
import PurchaseWorkflow from './PurchaseWorkflow';
import PurchaseResearch from './PurchaseResearch';
import PurchaseTenderPage from './PurchaseTenderPage';
import styles from './PurchaseDashboard.module.css';
const PurchaseDashboard = () => {
  const menuItems = [
    { label: 'Purchasing Summary', path: '/purchase/overview', icon: 'truck' },
    { label: 'Purchase Research', path: '/purchase/research', icon: 'clipboard' },
    { label: 'Suppliers', path: '/purchase/suppliers', icon: 'briefcase' },
    { label: 'Purchase Orders', path: '/purchase/orders', icon: 'file-plus' },
    { label: 'Receiving', path: '/purchase/receiving', icon: 'package' },
    { label: 'Budget Workflow', path: '/purchase/workflow', icon: 'credit-card' },
    { label: 'Post Purchase Tender', path: '/purchase/tenders', icon: 'file-text' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Purchase Dashboard">
        <Routes>
          <Route path="overview" element={<PurchaseHome />} />
          <Route path="research" element={<PurchaseResearch />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="suppliers/:id" element={<SupplierProfile />} />
          <Route path="suppliers/create" element={<CreateSupplier />} />
          <Route path="orders" element={<PurchaseOrderList />} />
          <Route path="orders/create" element={<CreatePurchaseOrder />} />
          <Route path="orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="receiving" element={<Receiving />} />
            <Route path="workflow" element={<PurchaseWorkflow />} />
            <Route path="tenders" element={<PurchaseTenderPage />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};
export default PurchaseDashboard;
