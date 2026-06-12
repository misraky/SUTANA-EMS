import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import notificationService from '../../services/notificationService';
import {
  Home, Users, ClipboardList, Settings, BarChart2, ShoppingCart, FileText, Wallet,
  CreditCard, TrendingUp, Package, Truck, Printer, Layers, Receipt, AreaChart,
  List, User, FilePlus, Box, ArrowRight, Bell, Search, LogOut, ChevronDown, Monitor, CheckCircle
} from 'lucide-react';
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
