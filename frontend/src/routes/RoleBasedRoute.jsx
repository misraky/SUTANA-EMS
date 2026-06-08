import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
const RoleBasedRoute = ({ children, role, permission }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // No forced password change redirect — users go directly to their dashboard
  const hasRole = role ? (Array.isArray(role) ? role.some(r => authService.hasRole(r)) : authService.hasRole(role)) : true;
  const hasPermission = permission ? authService.hasPermission(permission) : true;
  if (!hasRole || !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};
export default RoleBasedRoute;
