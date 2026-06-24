import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, Users, ClipboardList, Settings, BarChart2, ShoppingCart, FileText, Wallet,
  CreditCard, TrendingUp, Package, Truck, Printer, Layers, Receipt, AreaChart,
  List, User, FilePlus, Box, ArrowRight, Bell, LogOut, ChevronDown, Monitor, CheckCircle, Car,
  Target, Shield, AlertTriangle, GitBranch, Scale, Building, AlertOctagon, UserCheck, Layout, Lock,
  Search, X,
  Key, Sprout, Pill, CirclePlus, MessageCircle
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import './DashboardLayout.css';

const ICONS = {
  dashboard:     <Home size={18} strokeWidth={2.5} />,
  users:         <Users size={18} strokeWidth={2.5} />,
  clipboard:     <ClipboardList size={18} strokeWidth={2.5} />,
  settings:      <Settings size={18} strokeWidth={2.5} />,
  'bar-chart':   <BarChart2 size={18} strokeWidth={2.5} />,
  'bar-chart-2': <BarChart2 size={18} strokeWidth={2.5} />,
  database:      <Monitor size={18} strokeWidth={2.5} />,
  'shopping-cart':<ShoppingCart size={18} strokeWidth={2.5} />,
  'file-text':   <FileText size={18} strokeWidth={2.5} />,
  wallet:        <Wallet size={18} strokeWidth={2.5} />,
  'credit-card': <CreditCard size={18} strokeWidth={2.5} />,
  'trending-up': <TrendingUp size={18} strokeWidth={2.5} />,
  package:       <Package size={18} strokeWidth={2.5} />,
  truck:         <Truck size={18} strokeWidth={2.5} />,
  printer:       <Printer size={18} strokeWidth={2.5} />,
  layers:        <Layers size={18} strokeWidth={2.5} />,
  receipt:       <Receipt size={18} strokeWidth={2.5} />,
  analytics:     <AreaChart size={18} strokeWidth={2.5} />,
  home:          <Home size={18} strokeWidth={2.5} />,
  list:          <List size={18} strokeWidth={2.5} />,
  user:          <User size={18} strokeWidth={2.5} />,
  'file-plus':   <FilePlus size={18} strokeWidth={2.5} />,
  box:           <Box size={18} strokeWidth={2.5} />,
  'arrow-right': <ArrowRight size={18} strokeWidth={2.5} />,
  target:        <Target size={18} strokeWidth={2.5} />,
  shield:        <Shield size={18} strokeWidth={2.5} />,
  'alert-triangle': <AlertTriangle size={18} strokeWidth={2.5} />,
  'git-branch':  <GitBranch size={18} strokeWidth={2.5} />,
  scale:         <Scale size={18} strokeWidth={2.5} />,
  building:      <Building size={18} strokeWidth={2.5} />,
  'alert-octagon': <AlertOctagon size={18} strokeWidth={2.5} />,
  'user-check':  <UserCheck size={18} strokeWidth={2.5} />,
  layout:        <Layout size={18} strokeWidth={2.5} />,
  lock:          <Lock size={18} strokeWidth={2.5} />,
  monitor:       <Monitor size={18} strokeWidth={2.5} />,
  car:           <Car size={18} strokeWidth={2.5} />,
  key:           <Key size={18} strokeWidth={2.5} />,
  sprout:        <Sprout size={18} strokeWidth={2.5} />,
  pill:          <Pill size={18} strokeWidth={2.5} />,
  'plus-circle': <CirclePlus size={18} strokeWidth={2.5} />,
  'message-circle': <MessageCircle size={18} strokeWidth={2.5} />,
  search:        <Search size={18} strokeWidth={2.5} />,
  default:       <CheckCircle size={18} strokeWidth={2.5} />
};

/* ── Notification Bell with dropdown ── */
const NotificationBell = ({ navigate }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await notificationService.getMyNotifications();
      if (res?.status === 'success' && Array.isArray(res.data)) {
        setItems(res.data.map(n => ({ ...n, isRead: n.is_read ?? n.isRead ?? false })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsReadV2();
    } catch (e) { console.error(e); }
  };

  const markRead = async (id) => {
    try {
      await notificationService.markAsReadV2(id);
      load();
    } catch (e) { console.error(e); }
  };

  const handleClick = (item) => {
    markRead(item.id);
    setOpen(false);
  };

  // badge count — only unread items
  const count = items.filter(i => !i.isRead).length;

  useEffect(() => { load(); }, []);

  const safeDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="dash-notif-btn"
        title="Notifications"
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            backgroundColor: '#EF4444', color: 'white',
            borderRadius: '9999px', fontSize: '10px', fontWeight: '700',
            minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1
          }}>{count > 9 ? '9+' : count}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '360px', backgroundColor: 'white',
          borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>Notifications</span>
            {count > 0 && <span style={{ fontSize: '12px', color: '#6B7280' }}>{count} unread</span>}
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
                <CheckCircle size={32} style={{ marginBottom: '8px', color: '#10B981' }} />
                <p style={{ margin: 0 }}>All caught up!</p>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleClick(item)}
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                    cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                    backgroundColor: item._type === 'car_request' ? '#EFF6FF' : '#F0FDF4',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: item._type === 'car_request' ? '#DBEAFE' : '#DCFCE7' }}>
                    {item._type === 'car_request' ? <Car size={16} color="#2563EB" /> : <Bell size={16} color="#16A34A" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#111827' }}>
                      {item.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.message}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                      {safeDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {count > 0 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
              <button
                onClick={() => { navigate('/notifications'); setOpen(false); }}
                  style={{ fontSize: '13px', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                >View All Notifications →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const DashboardLayout = ({ children, menuItems, title, hideTopbar }) => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const handleNav = (item) => {
    if (item.isExternal) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.path);
    }
    setMobileOpen(false);
  };
  const isActive = (item) => {
    const paths = item.activeMatch || [item.path];
    return paths.some(p => location.pathname.startsWith(p));
  };
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
        </div>
        {}
        <nav className="dash-nav">
          {menuItems.map((item, index) => {
            if (item.type === 'section') {
              return <div key={index} className="dash-nav-section-label">{item.label}</div>;
            }
            if (item.type === 'divider') {
              return <div key={index} className="dash-nav-divider" />;
            }
            return (
              <button
                key={item.path || index}
                className={`dash-nav-item ${isActive(item) ? 'active' : ''}`}
                onClick={() => handleNav(item)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="nav-icon">{ICONS[item.icon] || ICONS.default}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`dash-nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{ICONS[item.icon] || ICONS.default}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {/* ── Main Content Area ── */}
      <main className="dash-main">
        {/* ── Topbar ── */}
        {!hideTopbar && (
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button 
              className="dash-sidebar-toggle" 
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              ☰
            </button>
            {title && (
              <h2 className="dash-topbar-title">
                {title.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== title.split('\n').length - 1 && <br/>}
                  </React.Fragment>
                ))}
              </h2>
            )}
          </div>
          
          <div className="dash-topbar-center">
            <div className="dash-search">
              <span className="dash-search-icon">🔍</span>
              <input type="text" placeholder="Search medicines, orders, or customers..." />
            </div>
          </div>

          <div className="dash-topbar-right">
            <NotificationBell navigate={navigate} />
            <div className="dash-profile-dropdown" ref={profileRef}>
              <button 
                className={`dash-user-chip ${profileOpen ? 'open' : ''}`} 
                onClick={() => setProfileOpen(!profileOpen)}
                title={user?.roles?.[0]}
              >
                <div className="dash-avatar">
                  {user?.fullName?.charAt(0)?.toUpperCase() || <User size={14} />}
                </div>
                <div className="dash-user-info">
                  <div className="dash-user-name">{user?.fullName || 'User'}</div>
                  <div className="dash-user-role">{user?.roles?.[0] || 'Staff'}</div>
                </div>
                <ChevronDown size={14} className={`dropdown-arrow ${profileOpen ? 'rotate' : ''}`} />
              </button>
              
              {profileOpen && (
                <div className="dash-dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.fullName || 'User'}</p>
                    <p className="dropdown-email">{user?.email || 'user@sutana.com'}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => navigate(user?.roles?.includes('Admin') ? '/admin/settings' : '/customer/profile')}>
                    <User size={16} />
                    My Profile
                  </button>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        )}
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
