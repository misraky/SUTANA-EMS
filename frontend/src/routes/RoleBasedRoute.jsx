import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
const RoleBasedRoute = ({ children, role, permission }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const user = authService.getCurrentUser();
  if (user && user.mustChangePassword) {
    return <Navigate to="/auth/change-password" replace />;
  }
  const hasRole = role ? (Array.isArray(role) ? role.some(r => authService.hasRole(r)) : authService.hasRole(role)) : true;
  const hasPermission = permission ? authService.hasPermission(permission) : true;
  if (!hasRole || !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};
export default RoleBasedRoute;
