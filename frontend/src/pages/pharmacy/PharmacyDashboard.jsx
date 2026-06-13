import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

import PharmacyOverview from './PharmacyOverview';
import PharmacyProducts from './PharmacyProducts';
import PharmacyCategories from './PharmacyCategories';
import PharmacyBranches from './PharmacyBranches';
import PharmacyRequests from './PharmacyRequests';

const PharmacyDashboard = () => {
  const menuItems = [
    { label: 'POS & Overview', path: '/pharmacy/overview', icon: 'dashboard' },
    { label: 'Requests', path: '/pharmacy/requests', icon: 'clipboard' },
    { label: 'Products', path: '/pharmacy/products', icon: 'inventory' },
    { label: 'Categories', path: '/pharmacy/categories', icon: 'category' },
    { label: 'Branches', path: '/pharmacy/branches', icon: 'store' },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems} title={"Pharmacy\nManagement\nDashboard"}>
        <div>
          <Routes>
            <Route path="overview" element={<PharmacyOverview />} />
            <Route path="requests" element={<PharmacyRequests />} />
            <Route path="products" element={<PharmacyProducts />} />
            <Route path="categories" element={<PharmacyCategories />} />
            <Route path="branches" element={<PharmacyBranches />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PharmacyDashboard;
