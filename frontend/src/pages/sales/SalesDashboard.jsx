import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SalesHome from './SalesHome';
import POSPage from './POSPage';
import CustomerManagement from './CustomerManagement';
import SalesReports from './SalesReports';
import ReturnsPage from './ReturnsPage';
import ZReportPage from './ZReportPage';
import SalesOrders from './SalesOrders';
import SalesTenderProductPage from './SalesTenderProductPage';
import RetailOrderPage from './RetailOrderPage';

const SalesDashboard = () => {
  const location = useLocation();
  const menuItems = [
    { label: 'Walk-In Sale (POS)', path: '/sales/pos', icon: 'shopping-cart' },
    { label: 'Post Tender', path: '/sales/post-tender', icon: 'file-text' },
    { label: 'Manage Tenders', path: '/sales/manage-tenders', icon: 'list' },
    { label: 'Add Retail Product', path: '/sales/add-product', icon: 'package' },
    { label: 'Manage Retail Products', path: '/sales/manage-products', icon: 'box' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Sales Dashboard">
      <Routes key={location.pathname}>
        <Route path="pos" element={<RetailOrderPage />} />
        <Route path="post-tender" element={<SalesTenderProductPage initialTab="tender" initialSubtab="create" hideHeader />} />
        <Route path="manage-tenders" element={<SalesTenderProductPage initialTab="tender" initialSubtab="manage" hideHeader />} />
        <Route path="add-product" element={<SalesTenderProductPage initialTab="product" initialSubtab="create" hideHeader />} />
        <Route path="manage-products" element={<SalesTenderProductPage initialTab="product" initialSubtab="manage" hideHeader />} />
        <Route path="/" element={<Navigate to="pos" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default SalesDashboard;
