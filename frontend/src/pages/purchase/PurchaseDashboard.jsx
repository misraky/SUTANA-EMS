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
import ContractsManagement from './ContractsManagement';
import SupplierScorecard from './SupplierScorecard';
import FraudDetection from './FraudDetection';
import ProcurementAnalytics from './ProcurementAnalytics';
import styles from './PurchaseDashboard.module.css';

const PurchaseDashboard = () => {
  const menuItems = [
    { type: 'section', label: 'Procurement' },
    { label: 'Overview', path: '/purchase/overview', icon: 'home' },
    { label: 'Contracts & Agreements', path: '/purchase/contracts', icon: 'file-text' },
    { type: 'divider' },
    { type: 'section', label: 'Purchasing' },
    { label: 'Purchase Orders', path: '/purchase/orders', icon: 'file-plus' },
    { label: 'Suppliers', path: '/purchase/suppliers', icon: 'briefcase' },
    { label: 'Supplier Scorecard', path: '/purchase/scorecard', icon: 'target' },
    { type: 'divider' },
    { type: 'section', label: 'Intelligence' },
    { label: 'Analytics & KPIs', path: '/purchase/analytics', icon: 'bar-chart' },
    { label: 'Fraud Detection', path: '/purchase/fraud', icon: 'shield' },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          <Route path="overview" element={<PurchaseHome />} />
          <Route path="contracts" element={<ContractsManagement />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="suppliers/:id" element={<SupplierProfile />} />
          <Route path="suppliers/create" element={<CreateSupplier />} />
          <Route path="orders" element={<PurchaseOrderList />} />
          <Route path="orders/create" element={<CreatePurchaseOrder />} />
          <Route path="orders/:id" element={<PurchaseOrderDetail />} />
          <Route path="scorecard" element={<SupplierScorecard />} />
          <Route path="analytics" element={<ProcurementAnalytics />} />
          <Route path="fraud" element={<FraudDetection />} />
          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default PurchaseDashboard;
