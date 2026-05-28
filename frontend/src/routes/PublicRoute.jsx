import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (isAuthenticated) {
    const user = authService.getCurrentUser();
    const role = user?.roles?.[0] || 'Customer';
    const dashboardMap = {
      'Admin': '/admin',
      'CEO': '/ceo',
      'Finance': '/finance',
      'Printing Supervisor': '/printing',
      'Purchase': '/purchase',
      'Store Worker': '/store',
      'Sales/Cashier': '/sales',
      'Customer': '/customer'
    };
    return <Navigate to={dashboardMap[role] || '/'} replace />;
  }
  return children;
};
export default PublicRoute;
