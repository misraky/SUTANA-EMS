import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Printer, Pill, Car, Wheat, Store, Bell, Video, Users, PartyPopper, Package, X, CheckCircle } from 'lucide-react';
import './PublicLayout.css';

export const PublicNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [galleryDropdownOpen, setGalleryDropdownOpen] = useState(false);
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const guestNotifications = [
    { id: 1, title: 'Welcome to SUTANA!', message: 'Explore our full range of services — Printing, Pharmacy, Farming, Car Rental, and Retail.', time: 'Just now' },
    { id: 2, title: 'New Service Added', message: 'Visit our Retail Store for stationery, electronics, office supplies, and more.', time: '2 hours ago' },
    { id: 3, title: 'Holiday Schedule', message: 'Our campus store will be open 8 AM - 4 PM during the upcoming holiday.', time: '1 day ago' },
  ];

  const isActive = (path) => location.pathname === path;
  const isActiveStart = (prefix) => location.pathname.startsWith(prefix);

  const BrandIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
    if (e.key === 'Escape') setSearchQuery('');
  };

  return (
    <header className="pub-nav-modern">
      <div className="pub-nav-inner-modern">
        {/* Left: Brand */}
        <div className="pub-logo-modern" onClick={() => navigate('/')}>
          <BrandIcon />
          <span>SUTANA</span>
        </div>

        {/* Center: Nav Links */}
        <nav className="pub-nav-center-modern">
          <div
            className="pub-dropdown-wrapper"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <span className={`pub-link-modern ${(dropdownOpen || isActiveStart('/services') || isActiveStart('/fleet-gallery')) ? 'active' : ''}`}>
              Services
              <svg className="pub-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {dropdownOpen && (
              <div className="pub-dropdown-grid">
                <Link to="/services/printing" className={`pub-dropdown-item${isActive('/services/printing') ? ' pub-dropdown-item--active' : ''}`} onClick={() => setDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Printer size={18} strokeWidth={2} /></span>
                  <span>Commercial Printing</span>
                </Link>
                <Link to="/services/pharmacy" className={`pub-dropdown-item${isActive('/services/pharmacy') ? ' pub-dropdown-item--active' : ''}`} onClick={() => setDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Pill size={18} strokeWidth={2} /></span>
                  <span>Pharmacy &amp; Health</span>
                </Link>
                <Link to="/fleet-gallery" className={`pub-dropdown-item${isActive('/fleet-gallery') ? ' pub-dropdown-item--active' : ''}`} onClick={() => setDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Car size={18} strokeWidth={2} /></span>
                  <span>Car Rental</span>
                </Link>
                <Link to="/services/farming" className={`pub-dropdown-item${isActive('/services/farming') ? ' pub-dropdown-item--active' : ''}`} onClick={() => setDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Wheat size={18} strokeWidth={2} /></span>
                  <span>Farming &amp; Agriculture</span>
                </Link>
                <Link to="/services/retail" className={`pub-dropdown-item${isActive('/services/retail') ? ' pub-dropdown-item--active' : ''}`} onClick={() => setDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Store size={18} strokeWidth={2} /></span>
                  <span>Retail Store</span>
                </Link>
              </div>
            )}
          </div>
          <div
            className="pub-dropdown-wrapper"
            onMouseEnter={() => setGalleryDropdownOpen(true)}
            onMouseLeave={() => setGalleryDropdownOpen(false)}
          >
            <span className={`pub-link-modern ${galleryDropdownOpen ? 'active' : ''}`}>
              Gallery
              <svg className="pub-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {galleryDropdownOpen && (
              <div className="pub-dropdown-grid">
                <Link to="/gallery#section-cars" className="pub-dropdown-item" onClick={() => setGalleryDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Car size={18} strokeWidth={2} /></span>
                  <span>Cars &amp; Fleet</span>
                </Link>
                <Link to="/gallery#section-workplace" className="pub-dropdown-item" onClick={() => setGalleryDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Users size={18} strokeWidth={2} /></span>
                  <span>Workers &amp; Workplace</span>
                </Link>
                <Link to="/gallery#section-events" className="pub-dropdown-item" onClick={() => setGalleryDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><PartyPopper size={18} strokeWidth={2} /></span>
                  <span>Events &amp; Activities</span>
                </Link>
                <Link to="/gallery#section-products" className="pub-dropdown-item" onClick={() => setGalleryDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Package size={18} strokeWidth={2} /></span>
                  <span>Products Showcase</span>
                </Link>
              </div>
            )}
          </div>
          <Link to="/about" className={`pub-link-modern${isActive('/about') ? ' active' : ''}`}>About Us</Link>
          <button className={`pub-link-btn${isActive('/track-order') ? ' active' : ''}`} onClick={() => navigate('/track-order')}>Track Order</button>
          <div className="pub-search-bar">
            <svg className="pub-search-bar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="pub-search-bar-input"
              placeholder="Search Sutana..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey}
            />
          </div>
          <div
            className="pub-dropdown-wrapper"
            onMouseEnter={() => setNewsDropdownOpen(true)}
            onMouseLeave={() => setNewsDropdownOpen(false)}
          >
            <span className={`pub-link-modern ${(newsDropdownOpen || isActiveStart('/news')) ? 'active' : ''}`}>
              News
              <svg className="pub-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {newsDropdownOpen && (
              <div className="pub-dropdown-grid">
                <Link to="/news/notice" className={`pub-dropdown-item${isActive('/news/notice') ? ' pub-dropdown-item--active' : ''}`} onClick={() => setNewsDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Bell size={18} strokeWidth={2} /></span>
                  <span>Notice</span>
                </Link>
                <Link to="/news/video" className={`pub-dropdown-item${isActive('/news/video') ? ' pub-dropdown-item--active' : ''}`} onClick={() => setNewsDropdownOpen(false)}>
                  <span className="pub-dropdown-icon"><Video size={18} strokeWidth={2} /></span>
                  <span>Video</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Notifications + Login */}
        <div className="pub-nav-right-modern">
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="pub-icon-btn"
              onClick={() => setNotifOpen(o => !o)}
              title="Notifications"
              style={{ position: 'relative' }}
            >
              <Bell size={20} />
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444'
              }} />
            </button>
            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '360px', background: 'white', borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
                zIndex: 1000, overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Announcements</span>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {guestNotifications.map(n => (
                    <div key={n.id} style={{
                      padding: '14px 18px', borderBottom: '1px solid #f9fafb',
                      cursor: 'default', display: 'flex', gap: '12px', alignItems: 'flex-start'
                    }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#eff6ff' }}>
                        <CheckCircle size={16} color="#3b82f6" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13, color: '#111827' }}>{n.title}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{n.message}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="pub-btn-solid-modern" onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    </header>
  );
};

export const PublicFooter = () => (
  <footer className="pub-footer">
    <div className="pub-container pub-footer-inner">
      <div className="pub-footer-brand">
        <span className="pub-footer-logo">SUTANA</span>
        <p>Modern Enterprise Management for Ethiopia's growing businesses. Built locally. Trusted widely.</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          {['📦 Inventory', '💰 Finance', '🛒 POS', '🚚 Purchase', '📊 Analytics'].map(m => (
            <span key={m} style={{ fontSize: '12px', color: 'var(--pub-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.08)' }}>{m}</span>
          ))}
        </div>
      </div>
      <div className="pub-footer-links">
        <div>
          <strong>Company</strong>
          <Link to="/">Home</Link>
          <Link to="/about">About &amp; Future</Link>
          <Link to="/services">Services</Link>
        </div>
        <div>
          <strong>Support</strong>
          <Link to="/contact">Contact Us</Link>
          <Link to="/login">Sign In</Link>
        </div>
        <div>
          <strong>Legal</strong>
          <span style={{ fontSize: '13px', color: 'var(--pub-text-muted)', cursor: 'default' }}>Privacy Policy</span>
          <span style={{ fontSize: '13px', color: 'var(--pub-text-muted)', cursor: 'default' }}>Terms of Service</span>
        </div>
      </div>
    </div>
    <div className="pub-footer-bottom">
      <p>© 2026 SUTANA Enterprise Management System. All rights reserved. · Injibara, Ethiopia</p>
    </div>
  </footer>
);
