import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (isAuthenticated) {
    const user = authService.getCurrentUser();
    const dashboardMap = {
      'Admin': '/admin',
      'CEO': '/ceo',
      'Finance': '/finance',
      'Purchase': '/purchase',
      'Store Manager': '/store',
      'Store Worker': '/store',
      'Sales/Cashier': '/sales',
      'Printing Supervisor': '/printing-manager',
      'Printing Worker': '/printing-worker',
      'Farming Manager': '/farming-manager',
      'Farming Worker': '/farming-worker',
      'Pharmacist': '/pharmacy',
      'Pharmacy Worker': '/pharmacy-worker',
      'Car Renting Manager': '/car-renting',
      'Market Research': '/market',
      'HR Manager': '/hr',
      'Customer': '/customer'
    };
    const rolePriority = [
      'Admin', 'CEO', 'Finance', 'Purchase', 'Store Manager', 'Store Worker', 'Sales/Cashier', 
      'Printing Supervisor', 'Farming Manager', 'Pharmacist', 'Car Renting Manager', 'Customer'
      'Admin', 'CEO', 'Finance', 'Purchase', 'Store Manager', 'Sales/Cashier', 
      'Printing Supervisor', 'Printing Worker', 'Farming Manager', 'Farming Worker', 'Pharmacist', 'Pharmacy Worker', 'Car Renting Manager',
      'Market Research', 'HR Manager', 'Customer'
    ];
    if (user?.roles) {
      for (const r of rolePriority) {
        if (user.roles.includes(r)) {
          if (dashboardMap[r]) return <Navigate to={dashboardMap[r]} replace />;
          return <Navigate to="/unauthorized" replace />;
        }
      }
    }
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};
export default PublicRoute;
