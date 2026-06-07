import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // No forced password change redirect — users go directly to their dashboard
  return children;
};
export default PrivateRoute;
