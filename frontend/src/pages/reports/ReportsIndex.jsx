import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SalesReport from './SalesReport';
import InventoryReport from './InventoryReport';
import FinancialReport from './FinancialReport';
import TaxReport from './TaxReport';
import styles from './ReportsIndex.module.css';
const ReportsHome = () => {
  const navigate = useNavigate();
  const reportCards = [
    {
      title: 'Sales Reports',
      description: 'Analyze daily, weekly, and custom period sales performance.',
      icon: '📈',
      path: '/reports/sales',
      color: '#eff6ff',
      textColor: '#2563eb'
    },
    {
      title: 'Inventory Reports',
      description: 'Track stock movements, low stock alerts, and expiring items.',
      icon: '📦',
      path: '/reports/inventory',
      color: '#f0fdf4',
      textColor: '#16a34a'
    },
    {
      title: 'Financial Reports',
      description: 'View Profit & Loss statements, expenses, and overall cash flow.',
      icon: '💰',
      path: '/reports/finance',
      color: '#fefce8',
      textColor: '#ca8a04'
    },
    {
      title: 'Tax & Audit',
      description: 'Generate VAT summaries and compliance tax audit documents.',
      icon: '📑',
      path: '/reports/tax',
      color: '#fdf2f8',
      textColor: '#db2777'
    }
  ];
  return (
    <div className={styles.homeContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports Dashboard</h1>
        <p className={styles.subtitle}>Select a category below to generate and view comprehensive business reports.</p>
      </div>
      <div className={styles.grid}>
        {reportCards.map((card, index) => (
          <div 
            key={index} 
            className={styles.card}
            onClick={() => navigate(card.path)}
          >
            <div 
              className={styles.iconWrapper} 
              style={{ backgroundColor: card.color, color: card.textColor }}
            >
              {card.icon}
            </div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDescription}>{card.description}</p>
            <div className={styles.cardFooter}>
              <span>View Reports →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const ReportsIndex = () => {
  const location = useLocation();
  const menuItems = [
    { label: 'Reports Home', path: '/reports/dashboard', icon: 'home' },
    { label: 'Sales Reports', path: '/reports/sales', icon: 'trending-up' },
    { label: 'Inventory Reports', path: '/reports/inventory', icon: 'package' },
    { label: 'Financial Reports', path: '/reports/finance', icon: 'dollar-sign' },
    { label: 'Tax & Audit', path: '/reports/tax', icon: 'file-text' },
  ];
  return (
    <div className={styles.indexWrapper}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          <Route path="dashboard" element={<ReportsHome />} />
          <Route path="sales" element={<SalesReport />} />
          <Route path="inventory" element={<InventoryReport />} />
          <Route path="finance" element={<FinancialReport />} />
          <Route path="tax" element={<TaxReport />} />
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};
export default ReportsIndex;
