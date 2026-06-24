import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CEOHome from './CEOHome';
import ExecutiveReports from './ExecutiveReports';
import TargetSettings from './TargetSettings';
import CEODashboardSummary from './CEODashboardSummary';
import PurchaseApprovals from './PurchaseApprovals';
import CashHandovers from '../finance/CashHandovers';
import CEOFarmingRequests from './CEOFarmingRequests';
import CEOPharmacyRequests from './CEOPharmacyRequests';
import CEORequests from './CEORequests';
import CEOPurchaseResearch from './CEOPurchaseResearch';
import CEOPurchaseWorkflow from './CEOPurchaseWorkflow';
import styles from './CEODashboard.module.css';
const CEODashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/ceo/overview', icon: 'home' },
    { label: 'Requests', path: '/ceo/requests', icon: 'shopping-cart', activeMatch: ['/ceo/requests', '/ceo/farming-requests', '/ceo/pharmacy-requests'] },
    { label: 'Purchase Research', path: '/ceo/purchase-research', icon: 'shopping-cart' },
    { label: 'Budget Workflow', path: '/ceo/budget-workflow', icon: 'credit-card' },
    { label: 'Tender Management', path: '/tenders/manage', icon: 'clipboard' },
  ];
  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="CEO Dashboard">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview"  element={<CEOHome />} />
            <Route path="reports"   element={<ExecutiveReports />} />
            <Route path="targets"   element={<TargetSettings />} />
            <Route path="summary"   element={<CEODashboardSummary />} />
            <Route path="approvals" element={<PurchaseApprovals />} />
            <Route path="handovers" element={<CashHandovers />} />
            <Route path="requests" element={<CEORequests />} />
            <Route path="farming-requests" element={<CEOFarmingRequests />} />
            <Route path="pharmacy-requests" element={<CEOPharmacyRequests />} />
            <Route path="purchase-research" element={<CEOPurchaseResearch />} />
            <Route path="budget-workflow" element={<CEOPurchaseWorkflow />} />
            <Route path="/"         element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};
export default CEODashboard;
