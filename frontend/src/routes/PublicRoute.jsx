import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (isAuthenticated) {
    const user = authService.getCurrentUser();
    const role = (user?.roles?.[0] || 'Customer').toLowerCase();
    const dashboardMap = {
      'admin': '/admin',
      'ceo': '/ceo',
      'finance': '/finance',
      'printing supervisor': '/printing',
      'purchase': '/purchase',
      'store worker': '/store',
      'sales/cashier': '/sales',
      'customer': '/customer'
    };
    
    const targetRoute = dashboardMap[role];
    if (targetRoute) {
      return <Navigate to={targetRoute} replace />;
    } else {
      // If role is completely unrecognized, clear auth and stay on login
      authService.logout();
      return children;
    }
  }
  return children;
};
export default PublicRoute;
