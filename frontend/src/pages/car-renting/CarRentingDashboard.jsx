import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FleetManager from './FleetManager';

const CarRentingOverview = () => (
  <div style={{ padding: '2rem' }}>
    <h2>Car Renting Overview</h2>
    <p>Welcome to the Car Renting Management Dashboard.</p>
  </div>
);

const CarRentingDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/car-renting/overview', icon: 'dashboard' },
    { label: 'Fleet Management', path: '/car-renting/fleet', icon: 'inventory' },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems}>
        <div>
          <Routes>
            <Route path="overview" element={<CarRentingOverview />} />
            <Route path="fleet" element={<FleetManager />} />
            <Route path="/" element={<Navigate to="fleet" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default CarRentingDashboard;
