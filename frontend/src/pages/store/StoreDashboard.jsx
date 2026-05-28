import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StoreHome from './StoreHome';
import InventoryList from './InventoryList';
import StockMovements from './StockMovements';
import InventoryAdjustment from './InventoryAdjustment';
import ReceivePO from './ReceivePO';
import DamagedLostItems from './DamagedLostItems';
import styles from './StoreDashboard.module.css';
const StoreDashboard = () => {
  const menuItems = [
    { label: 'Inventory Overview', path: '/store/overview', icon: 'box' },
    { label: 'Inventory List', path: '/store/inventory', icon: 'list' },
    { label: 'Stock Movements', path: '/store/movements', icon: 'repeat' },
    { label: 'Stock Adjustment', path: '/store/adjustment', icon: 'sliders' },
    { label: 'Receive PO', path: '/store/receive', icon: 'download' },
    { label: 'Damaged/Lost Items', path: '/store/damaged', icon: 'alert-triangle' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          <Route path="overview" element={<StoreHome />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="movements" element={<StockMovements />} />
          <Route path="adjustment" element={<InventoryAdjustment />} />
          <Route path="receive" element={<ReceivePO />} />
          <Route path="damaged" element={<DamagedLostItems />} />
          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};
export default StoreDashboard;
