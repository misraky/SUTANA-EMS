import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  const user = authService.getCurrentUser();
  if (user && user.mustChangePassword) {
    return <Navigate to="/auth/change-password" replace />;
  }
  return children;
};
export default PrivateRoute;
