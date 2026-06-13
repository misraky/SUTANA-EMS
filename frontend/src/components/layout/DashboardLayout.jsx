import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, Users, ClipboardList, Settings, BarChart2, ShoppingCart, FileText, Wallet,
  CreditCard, TrendingUp, Package, Truck, Printer, Layers, Receipt, AreaChart,
  List, User, FilePlus, Box, ArrowRight, Bell, Search, LogOut, ChevronDown, Monitor, CheckCircle, Car, X
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import './DashboardLayout.css';

const ICONS = {
  dashboard:     <Home size={18} strokeWidth={2.5} />,
  users:         <Users size={18} strokeWidth={2.5} />,
  clipboard:     <ClipboardList size={18} strokeWidth={2.5} />,
  settings:      <Settings size={18} strokeWidth={2.5} />,
  'bar-chart':   <BarChart2 size={18} strokeWidth={2.5} />,
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
      if (res.status === 'success') {
        setItems(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (e) { console.error(e); }
  };

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
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

  // When dropdown opens: load fresh items then mark all as read so badge clears
  useEffect(() => {
    if (open) {
      load();
      setTimeout(() => { markAllRead(); load(); }, 800); // small delay so user sees count then it clears
    }
  }, [open]);

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
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {count > 0 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
              <button
                onClick={() => { navigate('/car-renting/overview'); setOpen(false); }}
                style={{ fontSize: '13px', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >View all in Car Rental Dashboard →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const DashboardLayout = ({ children, menuItems }) => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationService.getNotifications();
        setNotifications(res.data?.data?.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id, notif.source);
        setNotifications(notifications.map(n => n.id === notif.id && n.source === notif.source ? { ...n, is_read: true } : n));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    setNotifOpen(false);
    if (notif.link_url) {
      navigate(notif.link_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const handleLogout = () => {
    logout();
    navigate('/');
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
              <span className="nav-icon">{ICONS[item.icon] || ICONS.default}</span>
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
            
            <div className="dash-notif-container" ref={notifRef}>
              <button 
                className="dash-notif-btn" 
                title="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
              </button>
              
              {notifOpen && (
                <div className="dash-notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="mark-all-btn" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-body">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id + '-' + notif.source} 
                          className={`notif-item ${notif.is_read ? 'read' : 'unread'}`}
                          onClick={() => handleNotifClick(notif)}
                        >
                          <div className="notif-title">{notif.title}</div>
                          <div className="notif-message">{notif.message}</div>
                          <div className="notif-time">{new Date(notif.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
        {}
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
