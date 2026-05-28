import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';
const ICONS = {
  dashboard:     '🏠',
  users:         '👥',
  clipboard:     '📋',
  settings:      '⚙️',
  'bar-chart':   '📊',
  'shopping-cart':'🛒',
  'file-text':   '📄',
  wallet:        '💰',
  'credit-card': '💳',
  'trending-up': '📈',
  package:       '📦',
  truck:         '🚚',
  printer:       '🖨️',
  layers:        '🗂️',
  receipt:       '🧾',
  analytics:     '📉',
  home:          '🏠',
  list:          '📑',
  user:          '👤',
  'file-plus':   '📝',
  box:           '📦',
  'arrow-right': '➡️',
};
const DashboardLayout = ({ children, menuItems }) => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  const isActive = (path) => location.pathname.startsWith(path);
  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };
  return (
    <div className="dashboard-wrapper">
      {}
      <div 
        className={`dash-mobile-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      {}
      <aside className={`dash-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {}
        <div className="dash-brand" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="SUTANA" className="dash-brand-logo"
            onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="dash-brand-name">SUTANA</span>
        </div>
        {}
        <nav className="dash-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`dash-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{ICONS[item.icon] || '●'}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {/* ── Main Content Area ── */}
      <main className="dash-main">
        {/* ── Topbar ── */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button 
              className="dash-sidebar-toggle" 
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              ☰
            </button>
            <div className="dash-search">
              <span className="dash-search-icon">🔍</span>
              <input type="text" placeholder="Search across ERP..." />
            </div>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-notif-btn" title="Notifications">
              🔔
              <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--surface)' }}></span>
            </button>
            <div className="dash-user-chip" title={user?.roles?.[0]}>
              <div className="dash-avatar">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.fullName || 'User'}</div>
                <div className="dash-user-role">{user?.roles?.[0] || 'Staff'}</div>
              </div>
            </div>
            <button className="dash-logout-btn" onClick={handleLogout}>
              🚪 <span className="logout-text">Logout</span>
            </button>
          </div>
        </header>
        {}
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
