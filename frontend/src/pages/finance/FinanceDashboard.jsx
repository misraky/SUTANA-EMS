import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FinanceHome from './FinanceHome';
import PaymentTracking from './PaymentTracking';
import ExpenseManagement from './ExpenseManagement';
import EnhancedExpenseManagement from './EnhancedExpenseManagement';
import FinancialReports from '../reports/FinancialReport';
import RentalPaymentVerification from './RentalPaymentVerification';
import BudgetManagement from './BudgetManagement';

import ChartOfAccounts from './ChartOfAccounts';
import CloseProcess from './CloseProcess';
import ApprovalDashboard from './ApprovalDashboard';
import ReportSubmissions from './ReportSubmissions';
import CashHandovers from './CashHandovers';
import FinanceVoid from './FinanceVoid';
import POPayments from './POPayments';
import FinancePurchaseWorkflow from './FinancePurchaseWorkflow';
import styles from './FinanceDashboard.module.css';

const FinanceDashboard = () => {
  const menuItems = [
    { label: 'Financial Summary', path: '/finance/overview', icon: 'wallet' },
    { label: 'Payment Tracking',  path: '/finance/payments', icon: 'credit-card' },
    { label: 'Rental Payments',  path: '/finance/rental-payments', icon: 'car' },
    { label: 'Cash Handovers',  path: '/finance/handovers', icon: 'file-text' },
    { label: 'Expense Management',path: '/finance/expenses', icon: 'shopping-cart' },
    { label: 'Expenses (ERP)',    path: '/finance/expenses-erp', icon: 'clipboard-list' },
    { label: 'Approvals',         path: '/finance/approvals', icon: 'check-circle' },
    { label: 'Budget',            path: '/finance/budget', icon: 'pie-chart' },
    { label: 'Chart of Accounts', path: '/finance/coa', icon: 'book' },
    { label: 'Month-End Close',   path: '/finance/close', icon: 'lock' },
    { label: 'Rental Payments',   path: '/finance/rental-payments', icon: 'car' },
    { label: 'Financial Reports', path: '/finance/reports', icon: 'bar-chart' },
    { label: 'Report Approvals',  path: '/finance/report-submissions', icon: 'send' },
    { label: 'Void Sales',       path: '/finance/void',    icon: 'credit-card' },
    { label: 'PO Payments',      path: '/finance/po-payments', icon: 'file-text' },
    { label: 'Budget Workflow',  path: '/finance/budget-workflow', icon: 'credit-card' },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Finance Dashboard">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<FinanceHome />} />
            <Route path="payments" element={<PaymentTracking />} />
            <Route path="rental-payments" element={<RentalPaymentVerification />} />
            <Route path="handovers" element={<CashHandovers />} />
            <Route path="expenses" element={<ExpenseManagement />} />
            <Route path="expenses-erp" element={<EnhancedExpenseManagement />} />
            <Route path="approvals" element={<ApprovalDashboard />} />
            <Route path="budget" element={<BudgetManagement />} />
            <Route path="coa" element={<ChartOfAccounts />} />
            <Route path="close" element={<CloseProcess />} />
            <Route path="rental-payments" element={<RentalPaymentVerification />} />
            <Route path="reports"  element={<FinancialReports />} />
            <Route path="report-submissions" element={<ReportSubmissions />} />
            <Route path="void"     element={<FinanceVoid />} />
            <Route path="po-payments" element={<POPayments />} />
            <Route path="budget-workflow" element={<FinancePurchaseWorkflow />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default FinanceDashboard;
