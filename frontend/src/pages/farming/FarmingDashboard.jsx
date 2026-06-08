import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const FarmingHome = () => (
  <div style={{ padding: '2rem' }}>
    <h2>Farming Overview</h2>
    <p>Welcome to the Farming Management Dashboard.</p>
  </div>
);

const FarmingDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/farming/overview', icon: 'dashboard' },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems}>
        <div>
          <Routes>
            <Route path="overview" element={<FarmingHome />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default FarmingDashboard;
