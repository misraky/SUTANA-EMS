import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CEOHome from './CEOHome';
import Analytics from './Analytics';
import ExecutiveReports from './ExecutiveReports';
import TargetSettings from './TargetSettings';
import styles from './CEODashboard.module.css';
const CEODashboard = () => {
  const menuItems = [
    { label: 'Strategic Overview', path: '/ceo/overview',  icon: 'trending-up' },
    { label: 'Analytics',          path: '/ceo/analytics', icon: 'bar-chart' },
    { label: 'Executive Reports',  path: '/ceo/reports',   icon: 'file-text' },
    { label: 'Target Settings',    path: '/ceo/targets',   icon: 'target' },
    { label: 'Approve Purchases',  path: '/purchase/orders', icon: 'clipboard' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview"  element={<CEOHome />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports"   element={<ExecutiveReports />} />
            <Route path="targets"   element={<TargetSettings />} />
            <Route path="/"         element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};
export default CEODashboard;
