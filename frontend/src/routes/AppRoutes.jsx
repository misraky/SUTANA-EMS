import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import RoleBasedRoute from './RoleBasedRoute';
const LandingPage      = lazy(() => import('../pages/LandingPage/LandingPage'));
const ServicesPage     = lazy(() => import('../pages/LandingPage/ServicesPage'));
const FleetGalleryPage = lazy(() => import('../pages/LandingPage/FleetGalleryPage'));
const NewsPage          = lazy(() => import('../pages/LandingPage/NewsPage'));
const AboutPage        = lazy(() => import('../pages/LandingPage/AboutPage'));
const ContactPage      = lazy(() => import('../pages/LandingPage/ContactPage'));
const PrintingPage     = lazy(() => import('../pages/LandingPage/PrintingPage'));
const PharmacyPage     = lazy(() => import('../pages/LandingPage/PharmacyPage'));
const FarmingPage      = lazy(() => import('../pages/LandingPage/FarmingPage'));
const RetailPage       = lazy(() => import('../pages/LandingPage/RetailPage'));
const FinancePage      = lazy(() => import('../pages/LandingPage/FinancePage'));
const InventoryPage    = lazy(() => import('../pages/LandingPage/InventoryPage'));
const SalesPage        = lazy(() => import('../pages/LandingPage/SalesPage'));
const PurchasePage     = lazy(() => import('../pages/LandingPage/PurchasePage'));
const GlobalChatPage   = lazy(() => import('../pages/LandingPage/GlobalChatPage'));
const PharmacyHealthPage = lazy(() => import('../pages/LandingPage/PharmacyHealthPage'));
const FarmingServicePage = lazy(() => import('../pages/LandingPage/FarmingServicePage'));
const PrintingServicePage = lazy(() => import('../pages/LandingPage/PrintingServicePage'));
const RetailStorePage = lazy(() => import('../pages/LandingPage/RetailStorePage'));
const GalleryPage        = lazy(() => import('../pages/LandingPage/GalleryPage'));
const TrackOrderPage     = lazy(() => import('../pages/LandingPage/TrackOrderPage'));
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
const PrintingManagerDashboard = lazy(() => import('../pages/printing/PrintingManagerDashboard'));
const PrintingWorkerDashboard = lazy(() => import('../pages/printing/PrintingWorkerDashboard'));
const CustomerDashboard = lazy(() => import('../pages/customer/CustomerPortal'));
const FarmingManagerDashboard = lazy(() => import('../pages/farming/FarmingManagerDashboard'));
const FarmingWorkerDashboard = lazy(() => import('../pages/farming/FarmingWorkerDashboard'));
const MarketDashboard = lazy(() => import('../pages/market/MarketDashboard'));
const PharmacyDashboard = lazy(() => import('../pages/pharmacy/PharmacyDashboard'));
const PharmacyWorkerDashboard = lazy(() => import('../pages/pharmacy/PharmacyWorkerDashboard'));
const CarRentingDashboard = lazy(() => import('../pages/car-renting/CarRentingDashboard'));
const ReportsIndex    = lazy(() => import('../pages/reports/ReportsIndex'));
const PlaceholderPage = lazy(() => import('../pages/LandingPage/PlaceholderPage'));
const TrackOrderPage = lazy(() => import('../pages/LandingPage/TrackOrderPage'));
const ReportsIndex     = lazy(() => import('../pages/reports/ReportsIndex'));
const HRDashboard      = lazy(() => import('../pages/hr/HRDashboard'));
const NotificationsPage = lazy(() => import('../pages/employee/NotificationsPage'));
const PrescriptionViewer = lazy(() => import('../pages/shared/PrescriptionViewer'));
const PublicTendersPage = lazy(() => import('../pages/LandingPage/PublicTendersPage'));
const TenderDetailPage = lazy(() => import('../pages/LandingPage/TenderDetailPage'));
const TenderManagePage = lazy(() => import('../pages/admin/TenderManagePage'));
const SearchResultsPage = lazy(() => import('../pages/LandingPage/SearchResultsPage'));
const RegularMarketPage = lazy(() => import('../pages/LandingPage/RegularMarketPage'));
const SalesDashboard = lazy(() => import('../pages/sales/SalesDashboard'));
const UnauthorizedPage  = lazy(() => import('../pages/auth/Unauthorized'));
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
        {/* Public / Landing Pages — redirect to dashboard if logged in */}
        <Route path="/"         element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/services" element={<PublicRoute><ServicesPage /></PublicRoute>} />
        <Route path="/services/printing" element={<PublicRoute><PrintingPage /></PublicRoute>} />
        <Route path="/services/pharmacy" element={<PublicRoute><PharmacyPage /></PublicRoute>} />
        <Route path="/services/farming" element={<PublicRoute><FarmingPage /></PublicRoute>} />
        <Route path="/services/retail" element={<PublicRoute><RetailPage /></PublicRoute>} />
        <Route path="/services/finance" element={<PublicRoute><FinancePage /></PublicRoute>} />
        <Route path="/services/inventory" element={<PublicRoute><InventoryPage /></PublicRoute>} />
        <Route path="/services/sales" element={<PublicRoute><SalesPage /></PublicRoute>} />
        <Route path="/services/purchase" element={<PublicRoute><PurchasePage /></PublicRoute>} />
        <Route path="/fleet-gallery" element={<FleetGalleryPage />} />
        <Route path="/about"    element={<PublicRoute><AboutPage /></PublicRoute>} />
        <Route path="/contact"  element={<PublicRoute><ContactPage /></PublicRoute>} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/search" element={<PublicRoute><PlaceholderPage /></PublicRoute>} />
        <Route path="/gallery/workers" element={<PublicRoute><PlaceholderPage /></PublicRoute>} />
        <Route path="/gallery/cars" element={<PublicRoute><PlaceholderPage /></PublicRoute>} />
        <Route path="/gallery/other" element={<PublicRoute><PlaceholderPage /></PublicRoute>} />
        <Route path="/news/notice" element={<PublicRoute><PlaceholderPage /></PublicRoute>} />
        <Route path="/news/video" element={<PublicRoute><PlaceholderPage /></PublicRoute>} />
        <Route path="/news/gallery" element={<PublicRoute><PlaceholderPage /></PublicRoute>} />
        <Route path="/services/pharmacy" element={<PharmacyHealthPage />} />
        <Route path="/services/farming" element={<FarmingServicePage />} />
        <Route path="/services/printing" element={<PrintingServicePage />} />
        <Route path="/services/retail" element={<RetailStorePage />} />
        <Route path="/marketplace/regular" element={<RegularMarketPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:type" element={<NewsPage />} />
        <Route path="/tenders" element={<PublicTendersPage />} />
        <Route path="/tenders/:id" element={<TenderDetailPage />} />
        <Route path="/prescription-viewer" element={<PrescriptionViewer />} />
        <Route path="/fleet-gallery" element={<FleetGalleryPage />} />
        <Route path="/about"    element={<PublicRoute><AboutPage /></PublicRoute>} />
        <Route path="/chat"     element={<GlobalChatPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        {}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
          <RoleBasedRoute role={['Purchase', 'Admin']}>
            <PurchaseDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/store/*" element={
          <RoleBasedRoute role={['Store Manager', 'Store Worker', 'CEO']}>
            <StoreDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/printing-worker/*" element={
          <RoleBasedRoute role={['Printing Worker']}>
            <PrintingWorkerDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/printing-manager/*" element={
          <RoleBasedRoute role={['Printing Supervisor', 'Printing Manager', 'Admin', 'CEO']}>
            <PrintingManagerDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/customer/*" element={
          <PrivateRoute>
            <CustomerDashboard />
          </PrivateRoute>
        } />
        {}
        <Route path="/farming-manager/*" element={
          <RoleBasedRoute role={['Farming Manager', 'Admin', 'CEO']}>
            <FarmingManagerDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/farming-worker/*" element={
          <RoleBasedRoute role={['Farming Worker', 'Farming Manager', 'Admin']}>
            <FarmingWorkerDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/market/*" element={
          <RoleBasedRoute role={['Admin', 'CEO', 'Market Research']}>
            <MarketDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/pharmacy/*" element={
          <RoleBasedRoute role="Pharmacist">
            <PharmacyDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/pharmacy-worker/*" element={
          <RoleBasedRoute role={['Pharmacy Worker', 'Pharmacist', 'Admin', 'CEO']}>
            <PharmacyWorkerDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/car-renting/*" element={
          <RoleBasedRoute role="Car Renting Manager">
            <CarRentingDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/hr/*" element={
          <RoleBasedRoute role={['HR Manager', 'Admin', 'CEO']}>
            <HRDashboard />
          </RoleBasedRoute>
        } />
        {}
        <Route path="/notifications" element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        } />
        <Route path="/reports/*" element={
          <PrivateRoute>
            <ReportsIndex />
          </PrivateRoute>
        } />
        <Route path="/sales/*" element={
          <RoleBasedRoute role={['Sales/Cashier', 'Admin', 'CEO', 'Sales Manager']}>
            <SalesDashboard />
          </RoleBasedRoute>
        } />
        <Route path="/tenders/manage" element={
          <RoleBasedRoute role={['Admin', 'CEO', 'Sales Manager']}>
            <TenderManagePage />
          </RoleBasedRoute>
        } />
        {}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
export default AppRoutes;
