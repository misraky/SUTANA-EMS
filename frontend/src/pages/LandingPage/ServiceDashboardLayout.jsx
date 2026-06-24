import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, DollarSign, Package, Wheat, Store, Car, Pill, Printer, 
  Settings, LogOut, Plus, Search, Bell, Grid, HelpCircle, Menu, X,
  ClipboardList, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './ServiceDashboardLayout.css';

const ServiceDashboardLayout = ({ children, activeModule }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userName = user?.name || 'Demo User';
  const userRole = user?.role || 'Administrator';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const NAV_ITEMS = [
    { label: 'Dashboard', icon: <Home size={18} strokeWidth={2.5} />, path: '/services' },
    { label: 'Finance', icon: <DollarSign size={18} strokeWidth={2.5} />, path: '/services/finance' },
    { label: 'Inventory', icon: <Package size={18} strokeWidth={2.5} />, path: '/services/inventory' },
    { label: 'Farming', icon: <Wheat size={18} strokeWidth={2.5} />, path: '/services/farming' },
    { label: 'Retail Store', icon: <Store size={18} strokeWidth={2.5} />, path: '/services/retail' },
    { label: 'Car Rental', icon: <Car size={18} strokeWidth={2.5} />, path: '/fleet-gallery' },
    { label: 'Pharmacy', icon: <Pill size={18} strokeWidth={2.5} />, path: '/services/pharmacy' },
    { label: 'Printing', icon: <Printer size={18} strokeWidth={2.5} />, path: '/services/printing' },
    { label: 'Purchase', icon: <ClipboardList size={18} strokeWidth={2.5} />, path: '/services/purchase' },
    { label: 'Sales', icon: <TrendingUp size={18} strokeWidth={2.5} />, path: '/services/sales' },
  ];

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const currentNavItem = NAV_ITEMS.find(item => location.pathname === item.path);
  const pageTitle = currentNavItem?.label || activeModule || 'Service';

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="sdl-wrapper">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sdl-overlay" onClick={closeSidebar} />}

      {/* ── Left Sidebar ── */}
      <aside className={`sdl-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sdl-brand" onClick={() => { navigate('/'); closeSidebar(); }} style={{ cursor: 'pointer' }}>
          <div className="sdl-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div className="sdl-brand-text">
            <span className="sdl-brand-title">Sutana ERP</span>
            <span className="sdl-brand-sub">Enterprise Suite</span>
          </div>
        </div>

        <nav className="sdl-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || activeModule === item.label;
            return (
              <Link 
                key={item.label} 
                to={item.path} 
                className={`sdl-nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sdl-sidebar-bottom">
          <button className="sdl-btn-add" onClick={() => { navigate('/contact'); closeSidebar(); }}>
            <Plus size={16} strokeWidth={3} />
            Add New Module
          </button>
          <Link to="/contact" className="sdl-bottom-link" onClick={closeSidebar}>
            <Settings size={18} strokeWidth={2.5} />
            Settings
          </Link>
          <Link to="/" className="sdl-bottom-link danger" onClick={closeSidebar}>
            <LogOut size={18} strokeWidth={2.5} />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="sdl-main">
        {/* ── Topbar ── */}
        <header className="sdl-topbar">
          <div className="sdl-topbar-left">
            <button className="sdl-mobile-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="sdl-page-title">{pageTitle}</span>
            <div className="sdl-search">
              <Search size={16} color="#94A3B8" strokeWidth={2.5} />
              <input
                type="text"
                placeholder={`Search ${pageTitle?.toLowerCase()} operations...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>
          </div>
          
          <div className="sdl-topbar-right">
            <div className="sdl-actions">
              <Bell size={20} strokeWidth={2} />
              <Grid size={20} strokeWidth={2} />
              <HelpCircle size={20} strokeWidth={2} />
            </div>
            <div className="sdl-user">
              <div className="sdl-user-info">
                <span className="sdl-user-name">{userName}</span>
                <span className="sdl-user-role">Role: {userRole}</span>
              </div>
              <div className="sdl-user-avatar" style={{ background: '#0070F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* ── Content Viewport ── */}
        <div className="sdl-content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ServiceDashboardLayout;
