import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Printer, Pill, Car, Wheat, Store, Video, Users, PartyPopper,
  Package, FileText, ShoppingCart, Menu, X, ChevronDown, LogIn, Home, Truck, Building2
} from 'lucide-react';
import SearchDropdown from '../../components/SearchDropdown';
import './PublicLayout.css';

/* ─── Helper: a single dropdown group ─────────────────────────── */
const NavDropdown = ({ label, isOpen, onOpen, onClose, children, isActive }) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  return (
    <div
      className={`pub-dropdown-wrapper${isOpen ? ' pub-dropdown-wrapper--open' : ''}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <span
        className={`pub-link-modern${isActive ? ' active' : ''}`}
        onClick={() => setMobileExpanded(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setMobileExpanded(v => !v)}
      >
        {label}
        <ChevronDown size={13} className={`pub-chevron${isOpen || mobileExpanded ? ' pub-chevron--open' : ''}`} />
      </span>
      {/* Desktop dropdown */}
      {isOpen && (
        <div className="pub-dropdown-grid pub-dropdown-desktop">
          {children}
        </div>
      )}
      {/* Mobile accordion */}
      <div className={`pub-mobile-accordion${mobileExpanded ? ' pub-mobile-accordion--open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

/* ─── Main Nav ─────────────────────────────────────────────────── */
export const PublicNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [servicesOpen, setServicesOpen]     = useState(false);
  const [marketOpen, setMarketOpen]         = useState(false);
  const [galleryOpen, setGalleryOpen]       = useState(false);
  const [newsOpen, setNewsOpen]             = useState(false);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const headerRef = useRef(null);

  const isActive    = (path)   => location.pathname === path;
  const isActiveAt  = (prefix) => location.pathname.startsWith(prefix);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => {
    setServicesOpen(false); setMarketOpen(false);
    setGalleryOpen(false);  setNewsOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="pub-nav-modern" ref={headerRef}>
      <div className="pub-nav-inner-modern">

        {/* ── Hamburger + Logo (left) ── */}
        <div className="pub-logo-modern" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <button
            className="pub-mobile-toggle pub-mobile-toggle-left"
            onClick={(e) => { e.stopPropagation(); setMobileOpen(v => !v); }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Home size={26} className="brand-icon" style={{ color: '#10b981' }} />
          <span>SUTANA</span>
        </div>



        {/* ── Desktop nav links ── */}
        <nav className="pub-nav-links-desktop">
          <NavDropdown
            label="Services"
            isOpen={servicesOpen}
            onOpen={() => setServicesOpen(true)}
            onClose={() => setServicesOpen(false)}
            isActive={isActiveAt('/services') || isActiveAt('/fleet-gallery')}
          >
            <Link to="/services/printing"  className={`pub-dropdown-item${isActive('/services/printing')  ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon"><Printer size={17}/></span><span>Commercial Printing</span></Link>
            <Link to="/services/pharmacy"  className={`pub-dropdown-item${isActive('/services/pharmacy')  ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon"><Pill size={17}/></span><span>Pharmacy &amp; Health</span></Link>
            <Link to="/fleet-gallery"      className={`pub-dropdown-item${isActive('/fleet-gallery')      ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon"><Car size={17}/></span><span>Car Rental</span></Link>
            <Link to="/services/farming"   className={`pub-dropdown-item${isActive('/services/farming')   ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon"><Wheat size={17}/></span><span>Farming &amp; Agriculture</span></Link>
            <Link to="/services/retail"    className={`pub-dropdown-item${isActive('/services/retail')    ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon"><Store size={17}/></span><span>Retail Store</span></Link>
          </NavDropdown>

          <NavDropdown
            label="Marketplace"
            isOpen={marketOpen}
            onOpen={() => setMarketOpen(true)}
            onClose={() => setMarketOpen(false)}
            isActive={isActiveAt('/tenders') || isActiveAt('/marketplace')}
          >
            <Link to="/tenders"              className="pub-dropdown-item" onClick={closeAll}><span className="pub-dropdown-icon"><FileText size={17}/></span><span>Tenders</span></Link>
            <Link to="/marketplace/regular"  className="pub-dropdown-item" onClick={closeAll}><span className="pub-dropdown-icon"><ShoppingCart size={17}/></span><span>Regular Market</span></Link>
          </NavDropdown>

          <NavDropdown
            label="Gallery"
            isOpen={galleryOpen}
            onOpen={() => setGalleryOpen(true)}
            onClose={() => setGalleryOpen(false)}
            isActive={isActiveAt('/gallery')}
          >
            <Link to="/gallery#section-cars"       className="pub-dropdown-item" onClick={closeAll}><span className="pub-dropdown-icon"><Car size={17}/></span><span>Cars &amp; Fleet</span></Link>
            <Link to="/gallery#section-workplace"  className="pub-dropdown-item" onClick={closeAll}><span className="pub-dropdown-icon"><Users size={17}/></span><span>Workers &amp; Workplace</span></Link>
            <Link to="/gallery#section-events"     className="pub-dropdown-item" onClick={closeAll}><span className="pub-dropdown-icon"><PartyPopper size={17}/></span><span>Events &amp; Activities</span></Link>
            <Link to="/gallery#section-products"   className="pub-dropdown-item" onClick={closeAll}><span className="pub-dropdown-icon"><Package size={17}/></span><span>Products Showcase</span></Link>
          </NavDropdown>

          <NavDropdown
            label="News"
            isOpen={newsOpen}
            onOpen={() => setNewsOpen(true)}
            onClose={() => setNewsOpen(false)}
            isActive={isActiveAt('/news')}
          >
            <Link to="/news"          className={`pub-dropdown-item${isActive('/news')         ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon">📡</span><span>All News</span></Link>
            <Link to="/news/news"     className={`pub-dropdown-item${isActive('/news/news')    ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon">📰</span><span>News</span></Link>
            <Link to="/news/hiring"   className={`pub-dropdown-item${isActive('/news/hiring')  ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon">💼</span><span>Hiring</span></Link>
            <Link to="/news/video"    className={`pub-dropdown-item${isActive('/news/video')   ? ' pub-dropdown-item--active' : ''}`} onClick={closeAll}><span className="pub-dropdown-icon"><Video size={17}/></span><span>Video</span></Link>
          </NavDropdown>

          <Link to="/track-order" className={`pub-link-modern${isActive('/track-order') ? ' active' : ''}`}>Track Order</Link>
          <Link to="/about"       className={`pub-link-modern${isActive('/about')       ? ' active' : ''}`}>About Us</Link>
        </nav>

        {/* ── Search ── */}
        <div className="pub-nav-search-wrap">
          <SearchDropdown />
        </div>

        {/* ── Right: Login ── */}
        <div className="pub-nav-right-modern">
          <button className="pub-btn-solid-modern" onClick={() => navigate('/login')}>
            <LogIn size={15} style={{ marginRight: 6 }} />
            <span>Login</span>
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown panel ── */}
      <div className={`pub-mobile-panel${mobileOpen ? ' pub-mobile-panel--open' : ''}`}>
        <nav className="pub-mobile-nav">
          {/* Services */}
          <MobileGroup label="Services" icon={<Store size={16}/>}>
            <Link to="/services/printing"  onClick={closeAll} className="pub-mobile-link"><Printer size={14}/> Commercial Printing</Link>
            <Link to="/services/pharmacy"  onClick={closeAll} className="pub-mobile-link"><Pill size={14}/> Pharmacy &amp; Health</Link>
            <Link to="/fleet-gallery"      onClick={closeAll} className="pub-mobile-link"><Car size={14}/> Car Rental</Link>
            <Link to="/services/farming"   onClick={closeAll} className="pub-mobile-link"><Wheat size={14}/> Farming &amp; Agriculture</Link>
            <Link to="/services/retail"    onClick={closeAll} className="pub-mobile-link"><Store size={14}/> Retail Store</Link>
          </MobileGroup>

          {/* Marketplace */}
          <MobileGroup label="Marketplace" icon={<ShoppingCart size={16}/>}>
            <Link to="/tenders"             onClick={closeAll} className="pub-mobile-link"><FileText size={14}/> Tenders</Link>
            <Link to="/marketplace/regular" onClick={closeAll} className="pub-mobile-link"><ShoppingCart size={14}/> Regular Market</Link>
          </MobileGroup>

          {/* Gallery */}
          <MobileGroup label="Gallery" icon={<Package size={16}/>}>
            <Link to="/gallery#section-cars"      onClick={closeAll} className="pub-mobile-link"><Car size={14}/> Cars &amp; Fleet</Link>
            <Link to="/gallery#section-workplace" onClick={closeAll} className="pub-mobile-link"><Users size={14}/> Workers &amp; Workplace</Link>
            <Link to="/gallery#section-events"    onClick={closeAll} className="pub-mobile-link"><PartyPopper size={14}/> Events &amp; Activities</Link>
            <Link to="/gallery#section-products"  onClick={closeAll} className="pub-mobile-link"><Package size={14}/> Products Showcase</Link>
          </MobileGroup>

          {/* News */}
          <MobileGroup label="News" icon={<Video size={16}/>}>
            <Link to="/news"        onClick={closeAll} className="pub-mobile-link">📡 All News</Link>
            <Link to="/news/news"   onClick={closeAll} className="pub-mobile-link">📰 News</Link>
            <Link to="/news/hiring" onClick={closeAll} className="pub-mobile-link">💼 Hiring</Link>
            <Link to="/news/video"  onClick={closeAll} className="pub-mobile-link"><Video size={14}/> Video</Link>
          </MobileGroup>

          <Link to="/track-order" onClick={closeAll} className="pub-mobile-top-link"><Truck size={18} className="pub-mobile-group-icon" /> Track Order</Link>
          <Link to="/about"       onClick={closeAll} className="pub-mobile-top-link"><Building2 size={18} className="pub-mobile-group-icon" /> About Us</Link>
        </nav>
      </div>
    </header>
  );
};

/* ─── Mobile accordion group ───────────────────────────────────── */
const MobileGroup = ({ label, icon, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="pub-mobile-group">
      <button className="pub-mobile-group-trigger" onClick={() => setOpen(v => !v)}>
        <span className="pub-mobile-group-icon">{icon}</span>
        <span>{label}</span>
        <ChevronDown size={14} className={`pub-mobile-chevron${open ? ' pub-mobile-chevron--open' : ''}`} />
      </button>
      <div className={`pub-mobile-group-body${open ? ' pub-mobile-group-body--open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// PublicFooter removed — SmartFooter from ModernSections is now global in App.jsx
