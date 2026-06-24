import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MarketPurchaseResearch from './MarketPurchaseResearch';

const MarketHome = () => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h2 style={{ margin: 0 }}>Market Team Dashboard</h2>
    </div>
    <p style={{ margin: 0, color: '#6b7280' }}>Welcome to the Market Team dashboard. Use the sidebar to navigate.</p>
  </div>
);

const MarketDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/market/overview', icon: 'dashboard' },
    { label: 'Purchase Research', path: '/market/research', icon: 'file-text' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <DashboardLayout menuItems={menuItems} title="Market Team Dashboard">
        <Routes>
          <Route path="overview" element={<MarketHome />} />
          <Route path="research" element={<MarketPurchaseResearch />} />
          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
};

export default MarketDashboard;
