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
      'Printing Supervisor': '/printing',
      'Farming Manager': '/farming',
      'Pharmacist': '/pharmacy',
      'Car Renting Manager': '/car-renting',
      'Customer': '/customer'
    };
    const rolePriority = [
      'Admin', 'CEO', 'Finance', 'Purchase', 'Store Manager', 'Store Worker', 'Sales/Cashier', 
      'Printing Supervisor', 'Farming Manager', 'Pharmacist', 'Car Renting Manager', 'Customer'
    ];
    let targetPath = '/customer';
    if (user?.roles) {
      for (const r of rolePriority) {
        if (user.roles.includes(r)) {
          targetPath = dashboardMap[r];
          break;
        }
      }
    }
    return <Navigate to={targetPath} replace />;
  }
  return children;
};
export default PublicRoute;
