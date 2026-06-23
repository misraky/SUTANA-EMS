import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import ContactPopup from './components/ContactPopup';
import { SmartFooter } from './pages/LandingPage/ModernSections';
import './App.css';

function GlobalBackArrow() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/')} aria-label="Go back to home"
      style={{
        position: 'fixed', bottom: 80, left: 20, zIndex: 9999,
        width: 44, height: 44, borderRadius: 12, border: '1px solid #e5e7eb',
        background: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}
    >
      <ArrowLeft size={20} color="#374151" />
    </button>
  );
}

function App() {
  const location = useLocation();
  const showFooter = ['/','/services','/gallery','/fleet-gallery','/news','/track-order','/about','/contact','/tenders','/search','/prescription-viewer'].some(p =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  );
  return (
    <div className="app-container">
      <AppRoutes />
      {showFooter && <SmartFooter />}
      <GlobalBackArrow />
      <ContactPopup />
      <ScrollToTop />
    </div>
  );
}

export default App;
