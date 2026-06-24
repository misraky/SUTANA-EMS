import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CEOHome from './CEOHome';
import ExecutiveReports from './ExecutiveReports';
import TargetSettings from './TargetSettings';
import CEOPurchases from './CEOPurchases';
import CEOEmployees from './CEOEmployees';
import CEOBoard from './CEOBoard';
import CEORisk from './CEORisk';
import CEOCrisis from './CEOCrisis';
import ReportApprovals from './ReportApprovals';
import CEOInventoryReport from './CEOInventoryReport';
import CEOExpenses from './CEOExpenses';
import SalesReports from '../sales/SalesReports';
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
    { type: 'section', label: 'Executive Core' },
    { label: 'Strategic Overview', path: '/ceo/overview', icon: 'trending-up' },
    { label: 'Executive Reports',  path: '/ceo/reports',   icon: 'file-text' },
    { label: 'Inventory Report',   path: '/ceo/inventory-report', icon: 'package' },
    { label: 'Sales Report',       path: '/ceo/sales-report', icon: 'dollar-sign' },
    { type: 'divider' },
    { type: 'section', label: 'Strategic Domains' },
    { label: 'Target Settings',    path: '/ceo/targets',   icon: 'target' },
    { label: 'Purchase Approvals', path: '/ceo/purchases', icon: 'clipboard' },
    { label: 'Expense Reports',    path: '/ceo/expenses',  icon: 'shopping-cart' },
    { label: 'HR & People',       path: '/ceo/hr',        icon: 'users' },
    { label: 'Board & Governance', path: '/ceo/board',     icon: 'shield' },
    { label: 'Report Approvals',   path: '/ceo/report-approvals', icon: 'check-circle' },
    { type: 'divider' },
    { type: 'section', label: 'Oversight' },
    { label: 'Risk & Compliance',  path: '/ceo/risk',      icon: 'alert-triangle' },
    { label: 'Crisis Management',  path: '/ceo/crisis',    icon: 'alert-octagon' },
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
            <Route path="inventory-report" element={<CEOInventoryReport />} />
            <Route path="sales-report" element={<SalesReports />} />
            <Route path="targets"   element={<TargetSettings />} />
            <Route path="purchases" element={<CEOPurchases />} />
            <Route path="expenses"  element={<CEOExpenses />} />
            <Route path="hr"        element={<CEOEmployees />} />
            <Route path="board"     element={<CEOBoard />} />
            <Route path="report-approvals" element={<ReportApprovals />} />
            <Route path="risk"      element={<CEORisk />} />
            <Route path="crisis"    element={<CEOCrisis />} />
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
