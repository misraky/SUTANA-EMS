import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const PharmacyHome = () => (
  <div style={{ padding: '2rem' }}>
    <h2>Pharmacy Overview</h2>
    <p>Welcome to the Pharmacy Management Dashboard.</p>
  </div>
);

const PharmacyDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/pharmacy/overview', icon: 'dashboard' },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems}>
        <div>
          <Routes>
            <Route path="overview" element={<PharmacyHome />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PharmacyDashboard;
