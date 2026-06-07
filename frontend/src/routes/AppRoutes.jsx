import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import RoleBasedRoute from './RoleBasedRoute';
const LandingPage      = lazy(() => import('../pages/LandingPage/LandingPage'));
const ServicesPage     = lazy(() => import('../pages/LandingPage/ServicesPage'));
const AboutPage        = lazy(() => import('../pages/LandingPage/AboutPage'));
const ContactPage      = lazy(() => import('../pages/LandingPage/ContactPage'));
const LoginPage          = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('../pages/auth/ResetPasswordPage'));
const TwoFactorPage      = lazy(() => import('../pages/auth/TwoFactorPage'));
const AdminDashboard    = lazy(() => import('../pages/admin/AdminDashboard'));
const CEODashboard      = lazy(() => import('../pages/ceo/CEODashboard'));
const FinanceDashboard  = lazy(() => import('../pages/finance/FinanceDashboard'));
const PurchaseDashboard = lazy(() => import('../pages/purchase/PurchaseDashboard'));
const StoreDashboard    = lazy(() => import('../pages/store/StoreDashboard'));
const SalesDashboard    = lazy(() => import('../pages/sales/SalesDashboard'));
const PrintingDashboard = lazy(() => import('../pages/printing/PrintingDashboard'));
const CustomerDashboard = lazy(() => import('../pages/customer/CustomerPortal'));
const FarmingDashboard  = lazy(() => import('../pages/farming/FarmingDashboard'));
const PharmacyDashboard = lazy(() => import('../pages/pharmacy/PharmacyDashboard'));
const CarRentingDashboard = lazy(() => import('../pages/car-renting/CarRentingDashboard'));
const ReportsIndex    = lazy(() => import('../pages/reports/ReportsIndex'));
const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#f8fafc',
    fontFamily: 'Inter, sans-serif', color: '#2563eb',
    fontSize: 15, gap: 10,
  }}>
    <span style={{ fontSize: 22 }}>⏳</span> Loading SUTANA…
  </div>
);
const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about"    element={<AboutPage />} />
        <Route path="/contact"  element={<ContactPage />} />
        {}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/auth/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/auth/two-factor" element={<PublicRoute><TwoFactorPage /></PublicRoute>} />
        {}
        <Route path="/admin/*" element={
          <RoleBasedRoute role="Admin">
            <AdminDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/ceo/*" element={
          <RoleBasedRoute role="CEO">
            <CEODashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/finance/*" element={
          <RoleBasedRoute role="Finance">
            <FinanceDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/purchase/*" element={
          <RoleBasedRoute role={['Purchase', 'CEO', 'Admin']}>
            <PurchaseDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/store/*" element={
          <RoleBasedRoute role="Store Worker">
            <StoreDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/sales/*" element={
          <RoleBasedRoute role="Sales/Cashier">
            <SalesDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/printing/*" element={
          <RoleBasedRoute role="Printing Supervisor">
            <PrintingDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/customer/*" element={
          <PrivateRoute>
            <CustomerDashboard />
          </PrivateRoute>
        } />
        {}
        <Route path="/farming/*" element={
          <RoleBasedRoute role="Farming Manager">
            <FarmingDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/pharmacy/*" element={
          <RoleBasedRoute role="Pharmacist">
            <PharmacyDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/car-renting/*" element={
          <RoleBasedRoute role="Car Renting Manager">
            <CarRentingDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/reports/*" element={
          <PrivateRoute>
            <ReportsIndex />
          </PrivateRoute>
        } />
        {}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
export default AppRoutes;
