import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Search, Bell, Settings, ChevronDown, LogOut, User,
  LayoutDashboard, Package, Wallet, BarChart3, X
} from 'lucide-react';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';
import './TopNavBar.css';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Inventory', path: '/store/inventory-list', icon: Package },
  { label: 'Finance',   path: '/finance/financial-summary', icon: Wallet },
  { label: 'Analytics', path: '/reports/sales-reports', icon: BarChart3 },
];

export default function TopNavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const socketRef = useRef(null);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isAdminCEO = user?.roles?.some(r => ['Admin', 'CEO'].includes(r));

  /* ── Fetch notifications (news + system) ── */
  const fetchAllNotifications = useCallback(async () => {
    try {
      const [newsRes, sysRes] = await Promise.all([
        notificationService.getMyNotifications(),
        notificationService.getSystemNotifications().catch(() => ({ data: [] })),
      ]);
      const news = newsRes?.status === 'success' ? (newsRes.data || []) : [];
      const sys = (sysRes?.data || []).map(n => ({
        id: `sys-${n.id}`,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt || n.created_at,
        isRead: n.isRead || n.is_read,
        _type: n.type || 'system',
        _refId: n.id,
      }));
      const merged = [...news, ...sys].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(merged);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAllNotifications();
  }, [isAuthenticated, fetchAllNotifications]);

  /* ── Socket.io for real-time pharmacy notifications (Admin/CEO only) ── */
  useEffect(() => {
    if (!isAuthenticated || !isAdminCEO) return;
    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('new-prescription-request', (data) => {
      setNotifications(prev => {
        const n = {
          id: `rt-${data.id}-${Date.now()}`,
          title: `New Prescription Request: ${data.request_number}`,
          message: `${data.customer_name} ordered ${data.medication_name} x${data.quantity}`,
          createdAt: new Date().toISOString(),
          isRead: false,
          _type: 'pharmacy',
          _refId: data.id,
        };
        return [n, ...prev];
      });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [isAuthenticated, isAdminCEO]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isFarmingRole = user?.roles?.some(r => r.toLowerCase().includes('farming'));
  const isCEO = location.pathname.startsWith('/ceo');
  const isFarmingPath = location.pathname.startsWith('/farming-manager') || location.pathname.startsWith('/farming');

  return (
    <header className="tnb-root">
      <div className="tnb-inner">
        {/* ── Left: Brand ── */}
        <Link to="/" className="tnb-brand">
          <span className="tnb-wordmark">SUTANA EMS</span>
        </Link>

        {/* ── Center: Nav Links or Dashboard title ── */}
        {isCEO ? (
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>CEO Dashboard</span>
        ) : isFarmingPath ? (
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Farming Manager Dashboard</span>
        ) : (
          <nav className="tnb-nav">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`tnb-link${isActive(link.path) ? ' tnb-link--active' : ''}`}
              >
                <link.icon size={16} strokeWidth={2} />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* ── Right: Search + Icons + Profile ── */}
        <div className="tnb-actions" style={isFarmingRole || isCEO ? { marginLeft: 'auto' } : undefined}>
          {/* Search */}
          {searchOpen ? (
            <form className="tnb-search-form" onSubmit={handleSearch}>
              <Search size={16} color="#9CA3AF" />
              <input
                autoFocus
                className="tnb-search-input"
                placeholder="Search..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onBlur={() => { if (!searchVal) setSearchOpen(false); }}
              />
              <button type="button" className="tnb-icon-btn" onMouseDown={() => setSearchOpen(false)}>
                <X size={16} />
              </button>
            </form>
          ) : (
            <button className="tnb-icon-btn" onClick={() => setSearchOpen(true)} title="Search">
              <Search size={18} />
            </button>
          )}

          {/* Notifications */}
          {!isFarmingPath && <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="tnb-icon-btn" onClick={() => setNotifOpen(o => !o)} title="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="tnb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="tnb-dropdown tnb-dropdown--notif">
                <div className="tnb-dropdown-header">
                  <span className="tnb-dropdown-title">Notifications</span>
                  {unreadCount > 0 && <span className="tnb-dropdown-sub">{unreadCount} unread</span>}
                </div>
                <div className="tnb-dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="tnb-dropdown-empty">All caught up!</div>
                  ) : (
                    notifications.slice(0, 5).map(n => {
                      const isPharmacy = n._type === 'pharmacy';
                      return (
                      <div key={n.id} className="tnb-notif-item" style={{ cursor: 'pointer', background: n.isRead ? 'transparent' : '#f0f7ff' }}
                        onClick={async () => {
                          setNotifOpen(false);
                          // Mark as read (system) or remove from local state (real-time/socket)
                          if (n.id && n.id.startsWith('sys-') && n._refId) {
                            try { await notificationService.markSystemAsRead(n._refId); } catch (_) {}
                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                          } else {
                            setNotifications(prev => prev.filter(x => x.id !== n.id));
                          }
                          if (isPharmacy) navigate('/ceo/pharmacy-requests');
                        }}>
                        <p className="tnb-notif-title">{n.title}</p>
                        <p className="tnb-notif-msg">{n.message}</p>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>}

          {/* Settings */}
          {!isCEO && !isFarmingPath && (
          <button className="tnb-icon-btn" onClick={() => navigate('/admin/settings')} title="Settings">
            <Settings size={18} />
          </button>
          )}

          {/* User Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button className="tnb-profile-btn" onClick={() => setProfileOpen(o => !o)}>
              <div className="tnb-avatar">{initials}</div>
              <ChevronDown size={14} className={`tnb-chevron${profileOpen ? ' tnb-chevron--open' : ''}`} />
            </button>
            {profileOpen && (
              <div className="tnb-dropdown tnb-dropdown--profile">
                <div className="tnb-dropdown-user">
                  <div className="tnb-avatar tnb-avatar--lg">{initials}</div>
                  <div>
                    <p className="tnb-user-name">{user?.name || 'User'}</p>
                    <p className="tnb-user-role">{user?.role || ''}</p>
                  </div>
                </div>
                <div className="tnb-dropdown-divider" />
                <button className="tnb-dropdown-item" onClick={() => { navigate('/admin/settings'); setProfileOpen(false); }}>
                  <User size={15} /> My Profile
                </button>
                <div className="tnb-dropdown-divider" />
                <button className="tnb-dropdown-item tnb-dropdown-item--danger" onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
