import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const CarRentingHome = () => (
  <div style={{ padding: '2rem' }}>
    <h2>Car Renting Overview</h2>
    <p>Welcome to the Car Renting Management Dashboard.</p>
  </div>
);

const CarRentingDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/car-renting/overview', icon: 'dashboard' },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems}>
        <div>
          <Routes>
            <Route path="overview" element={<CarRentingHome />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default CarRentingDashboard;
