import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StoreHome from './StoreHome';
import InventoryList from './InventoryList';
import StockMovements from './StockMovements';
import InventoryAdjustment from './InventoryAdjustment';
import ReceivePO from './ReceivePO';
import DamagedLostItems from './DamagedLostItems';
import StoreFarmingRequests from './StoreFarmingRequests';
import StorePurchaseResearch from './StorePurchaseResearch';
import StorePurchaseWorkflow from './StorePurchaseWorkflow';
import styles from './StoreDashboard.module.css';
const StoreDashboard = () => {
  const menuItems = [
    { label: 'Inventory Overview', path: '/store/overview', icon: 'box' },
    { label: 'Inventory List', path: '/store/inventory', icon: 'list' },
    { label: 'Stock Movements', path: '/store/movements', icon: 'repeat' },
    { label: 'Stock Adjustment', path: '/store/adjustment', icon: 'sliders' },
    { label: 'Receive PO', path: '/store/receive', icon: 'download' },
    { label: 'Damaged/Lost Items', path: '/store/damaged', icon: 'alert-triangle' },
    { label: 'Farming Requests', path: '/store/farming-requests', icon: 'shopping-cart' },
    { label: 'Purchase Research', path: '/store/purchase-research', icon: 'search' },
    { label: 'Budget Workflow', path: '/store/budget-workflow', icon: 'credit-card' },
    { label: 'Post Tender',  path: '/sales/post-tender',  icon: 'file-text' },
    { label: 'Add Product',  path: '/sales/add-product', icon: 'package' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Store Dashboard">
        <Routes>
          <Route path="overview" element={<StoreHome />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="movements" element={<StockMovements />} />
          <Route path="adjustment" element={<InventoryAdjustment />} />
          <Route path="receive" element={<ReceivePO />} />
          <Route path="damaged" element={<DamagedLostItems />} />
            <Route path="farming-requests" element={<StoreFarmingRequests />} />
            <Route path="purchase-research" element={<StorePurchaseResearch />} />
            <Route path="budget-workflow" element={<StorePurchaseWorkflow />} />
          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};
export default StoreDashboard;
