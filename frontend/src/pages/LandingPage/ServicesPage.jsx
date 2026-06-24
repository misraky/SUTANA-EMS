import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Printer, Pill, Car, Wheat, Store, Building2, Banknote, Newspaper, Bell, Video, GalleryHorizontal, Users, Folder } from 'lucide-react';
import './PublicLayout.css';
import './ServicesPage.css';
import ToggleSection from './ToggleSection';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Pill, Car, Wheat, Store, ArrowRight } from 'lucide-react';
import './PublicLayout.css';
export { PublicNav } from './PublicNavFooter';

const NAVY = '#1a2b4b';
const TEAL = '#0D7C66';

const services = [
  { icon: Printer, label: 'Commercial Printing',   path: '/services/printing', color: '#2563eb', bg: '#eff6ff', desc: 'Offset, digital, large-format printing with end-to-end production tracking.' },
  { icon: Pill,    label: 'Pharmacy & Health',      path: '/services/pharmacy', color: '#059669', bg: '#f0fdf4', desc: 'Prescription management, medication inventory, and health consultations.' },
  { icon: Car,     label: 'Car Rental',             path: '/fleet-gallery',     color: '#d97706', bg: '#fffbeb', desc: 'Reliable vehicles for short and long-term rental with flexible terms.' },
  { icon: Wheat,   label: 'Farming & Agriculture',  path: '/services/farming',  color: '#7c3aed', bg: '#f5f3ff', desc: 'Seeds, fertilizers, tools, and expert advice for modern farming.' },
  { icon: Store,   label: 'Retail Store',            path: '/services/retail',   color: '#ec4899', bg: '#fdf2f8', desc: 'Stationery, electronics, office supplies, and everyday essentials.' },
];

const ServiceCard = ({ service, index, isVisible }) => {
  const Icon = service.icon;

  return (
    <div className="service-card-wrap"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        opacity: isVisible ? 1 : 0,
        transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.1}s`,
      }}>
      <a href={service.path} onClick={e => { e.preventDefault(); window.location.href = service.path; }}
        className="service-card-inner"
        style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '24px 28px', borderRadius: 18,
          background: '#fff',
          textDecoration: 'none', cursor: 'pointer',
          position: 'relative', zIndex: 1,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = service.color; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: service.bg, color: service.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'transform 0.3s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(-4deg)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0)'}>
          <Icon size={26} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: NAVY, marginBottom: 4, letterSpacing: '-0.01em' }}>
            {service.label}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
            {service.desc}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.3s',
          color: '#9CA3AF',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = service.bg; e.currentTarget.style.color = service.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.transform = 'translateX(0)'; }}>
          <ArrowRight size={18} />
        </div>
      </a>
    </div>
  );
};

const SERVICES = [
  {
    key: 'printing',
    icon: '🖨️',
    title: 'Commercial Printing',
    desc: 'Revolutionize your print production from design to delivery. Optimize ink inventory, machine scheduling, and maintain strict tax compliance for heavy-duty manufacturing.',
    features: ['Automated Workflow Management', 'ERCA Compliant Invoicing', 'Real-time Consumables Tracking', 'Machine Utilization Analytics'],
    color: '#2563EB',
    bg: '#EFF6FF',
    to: '/services/printing',
  },
  {
    key: 'pharmacy',
    icon: '💊',
    title: 'Pharmacy & Health',
    desc: 'Deliver precision care with advanced inventory tracking. Manage batch expirations, serial numbers, and maintain strict EFDA readiness for medical distribution.',
    features: ['FEFO Batch Management', 'Prescription Fulfillment Tracking', 'Integrated Lab Reporting', 'Expiry Alert Automation'],
    color: '#7C3AED',
    bg: '#F5F3FF',
    to: '/services/pharmacy',
  },
  {
    key: 'car-rental',
    icon: '🚗',
    title: 'Car Rental',
    desc: 'Take control of your fleet from anywhere. Manage bookings, driver assignments, and vehicle maintenance schedules in a unified dashboard.',
    features: ['Dynamic Fleet Scheduler', 'Driver Performance Logs', 'GPS-Integrated Asset Tracking', 'Maintenance Forecasting'],
    color: '#0070F2',
    bg: '#E8F4FE',
    to: '/fleet-gallery',
  },
  {
    key: 'farming',
    icon: '🌾',
    title: 'Farming & Agriculture',
    desc: 'Maximize yield with data-driven agronomy. Monitor tool health, manage harvest supply chains, and track seasonal costs across large-scale operations.',
    features: ['Harvest Yield Analysis', 'Multi-farm Inventory Hub', 'Export Compliance Docs', 'Irrigation Schedule Tracking'],
    color: '#059669',
    bg: '#ECFDF5',
    to: '/services/farming',
  },
  {
    key: 'retail',
    icon: '🏪',
    title: 'Retail Store',
    desc: 'Unified commerce for modern retail. Sync online and offline sales, manage multi-location stocks, and reward customer loyalty with a powerful POS.',
    features: ['Omnichannel Inventory', 'Integrated Mobile POS', 'CRM & Loyalty Rewards', 'Automated Supplier Orders'],
    color: '#EA580C',
    bg: '#FFF7ED',
    to: '/services/retail',
  },
  {
    key: 'finance',
    icon: '🏦',
    title: 'Finance & Accounting',
    desc: 'Deep localized financial management. Automated VAT reporting, ETB currency integration, and comprehensive auditing for Ethiopian enterprises.',
    features: ['Multi-currency (ETB Focus)', 'Automated IFRS Reporting', 'Expense & Payroll Integration', 'Tax Authority Compliance'],
    color: '#0EA5E9',
    bg: '#F0F9FF',
    to: '/services/finance',
  },
  {
    key: 'inventory',
    icon: '📦',
    title: 'Inventory & Store Management',
    desc: 'Eliminate stock-outs and costly over-ordering. Monitor stock levels across multiple locations in real time, track every movement, and set automatic reorder thresholds.',
    features: ['Multi-Warehouse Support', 'Automated Reorder Alerts', 'Full Audit Trail', 'Supplier Performance Dashboard'],
    color: '#10B981',
    bg: '#F0FDF4',
    to: '/services/inventory',
  },
  {
    key: 'sales',
    icon: '🛒',
    title: 'Sales & Point of Sale',
    desc: 'A fast, intuitive POS interface designed for speed at the counter and intelligence in the back office. Empower your cashiers and delight your customers.',
    features: ['Fast, Intuitive POS UI', 'Customer Account Management', 'Per-Product Analytics', 'Multi-Tender Payments'],
    color: '#F59E0B',
    bg: '#FFFBEB',
    to: '/services/sales',
  },
  {
    key: 'purchase',
    icon: '🚚',
    title: 'Purchase & Procurement',
    desc: 'Streamline vendor management, track purchase order lifecycles, and confirm deliveries automatically. Build a robust, reliable supply chain.',
    features: ['Digital PO Creation', 'Supplier Performance Ratings', 'Delivery Alert System', 'Contract Management'],
    color: '#8B5CF6',
    bg: '#F5F3FF',
    to: '/services/purchase',
  },
];

/* ── Scroll reveal hook ── */
function useReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── ServiceCard component ── */
const ServiceCard = ({ s, idx }) => {
  const navigate = useNavigate();
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`sp-domain-card ${visible ? 'revealed' : ''}`} style={{ '--card-color': s.color }} id={`sp-service-${s.key}`} onClick={() => navigate(s.to)} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(s.to); } }}>
      <div className="sp-domain-card-top">
        <div className="sp-domain-icon-wrap" style={{background: s.bg, color: s.color}}>
          <span className="sp-domain-icon">{s.icon}</span>
        </div>
        <h3 className="sp-domain-title">{s.title}</h3>
      </div>
      <div className="sp-domain-card-body">
        <p className="sp-domain-desc">{s.desc}</p>
        <ul className="sp-domain-features">
          {s.features.map(f => (
            <li key={f}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <Link to={s.to} className="sp-domain-link" id={`sp-view-${s.key}`} onClick={(e) => e.stopPropagation()}>
        Explore Module
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>
    </div>
  );
};

const ServicesPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const filtered = activeFilter === 'all' ? SERVICES : SERVICES.filter(s => s.key === activeFilter);

  return (
    <div className="public-page sp-root">
      <PublicNav />

      <div className="sp-layout">
        {/* Mobile overlay */}
        {sidebarOpen && <div className="sp-sidebar-overlay" onClick={closeSidebar} />}

        {/* ── Sidebar ── */}
        <aside className={`sp-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sp-sidebar-header">
            <span className="sp-sidebar-label">SERVICE HUB</span>
            <button type="button" className="sp-sidebar-close" onClick={closeSidebar} aria-label="Close sidebar">✕</button>
          </div>
          <nav className="sp-sidebar-nav">
            <button
              type="button"
              className={`sp-sidebar-item ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveFilter('all'); closeSidebar(); }}
            >
              <span className="sp-sidebar-icon">🗂️</span>
              All Services
            </button>
            {SERVICES.map(s => (
              <button
                type="button"
                key={s.key}
                className={`sp-sidebar-item ${activeFilter === s.key ? 'active' : ''}`}
                onClick={() => { closeSidebar(); navigate(s.to); }}
              >
                <span className="sp-sidebar-icon">{s.icon}</span>
                {s.title}
              </button>
            ))}
          </nav>

          {/* Update notice */}
          <div className="sp-sidebar-notice">
            <span className="sp-sidebar-notice-badge">New Version Available</span>
            <p>Update your dashboard to v2.4 for enhanced Ethiopian tax reporting.</p>
            <button type="button" className="sp-sidebar-notice-btn" onClick={() => navigate('/login')}>Update Now</button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="sp-main">
          {/* Mobile sidebar toggle */}
          <button type="button" className="sp-mobile-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <span>Service Hub</span>
          </button>

          {/* ── Hero ── */}
          <section className="sp-hero">
            <div className="sp-hero-copy">
              <div className="sp-trust-strip">
                <span className="sp-trust-badge">ISO 27001</span>
                <span className="sp-trust-badge">SOC 2</span>
                <span className="sp-trust-badge">GDPR</span>
                <span className="sp-trust-badge">ERCA Compliant</span>
              </div>
              <h1 className="sp-hero-h1">
                Enterprise Resource Planning<br />
                <span className="sp-hero-subhead">Built for Ethiopian Operations</span>
              </h1>
              <p className="sp-hero-sub">
                Sutana ERP unifies fragmented operations into a compliant, high-performance ecosystem.
                Purpose-built for Ethiopian enterprises — from commercial printing to pharmacy distribution —
                with built-in ERCA compliance, multi-currency (ETB) support, and real-time analytics.
              </p>
              <div className="sp-hero-actions">
                <Link to="/contact?interest=demo" className="sp-btn-primary sp-btn-demo" id="sp-book-demo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Book a Demo
                </Link>
                <Link to="/contact?interest=sales" className="sp-btn-ghost" id="sp-talk-sales">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Talk to Sales
                </Link>
              </div>
            </div>

            {/* Enterprise metrics panel */}
            <div className="sp-hero-metrics">
              <div className="sp-hero-metrics-grid">
                <div className="sp-metric-card">
                  <span className="sp-metric-value">10K+</span>
                  <span className="sp-metric-label">Businesses Served</span>
                </div>
                <div className="sp-metric-card">
                  <span className="sp-metric-value">50+</span>
                  <span className="sp-metric-label">Integrated Modules</span>
                </div>
                <div className="sp-metric-card">
                  <span className="sp-metric-value">99.9%</span>
                  <span className="sp-metric-label">System Uptime</span>
                </div>
                <div className="sp-metric-card">
                  <span className="sp-metric-value">24/7</span>
                  <span className="sp-metric-label">Enterprise Support</span>
                </div>
              </div>
              <p className="sp-hero-metrics-footnote">
                Fully compliant with Ethiopian Revenue Authority (ERCA) regulations
              </p>
            </div>
          </section>

          {/* ── Trust Bar ── */}
          <div className="sp-trust-bar">
            <span className="sp-trust-bar-label">TRUSTED BY ENTERPRISES ACROSS ETHIOPIA</span>
            <div className="sp-trust-bar-logos">
              <span className="sp-trust-logo"><Building2 size={16} strokeWidth={2} /> Manufacturing</span>
              <span className="sp-trust-logo"><Pill size={16} strokeWidth={2} /> Pharmaceutical</span>
              <span className="sp-trust-logo"><Car size={16} strokeWidth={2} /> Automotive</span>
              <span className="sp-trust-logo"><Wheat size={16} strokeWidth={2} /> Agriculture</span>
              <span className="sp-trust-logo"><Store size={16} strokeWidth={2} /> Retail</span>
              <span className="sp-trust-logo"><Banknote size={16} strokeWidth={2} /> Finance</span>
            </div>
          </div>

          {/* ── Core Business Domains ── */}
          <section className="sp-domains">
            <div className="sp-domains-header">
              <div>
                <span className="sp-domains-label">INDUSTRY SOLUTIONS</span>
                <h2 className="sp-domains-title">Core Business Domains</h2>
                <p className="sp-domains-sub">Purpose-built ERP modules addressing the specific regulatory, operational, and compliance requirements of each industry sector.</p>
              </div>
              <div className="sp-filter-tabs">
                <button type="button" className={`sp-filter-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
                  All Industries
                </button>
                <Link to="/contact?ref=custom" className="sp-filter-cta">
                  Need Custom? →
                </Link>
              </div>
            </div>

            <div className="sp-domains-grid">
              {filtered.length === 0 ? (
                <div className="sp-empty">
                  <span className="sp-empty-icon">🔍</span>
                  <p className="sp-empty-text">No services match this filter</p>
                  <button type="button" className="sp-empty-btn" onClick={() => setActiveFilter('all')}>View All Services</button>
                </div>
              ) : (
                filtered.map((s, idx) => <ServiceCard key={s.key} s={s} idx={idx} />)
              )}
            </div>
          </section>

          {/* ── Enterprise CTA ── */}
          <section className="sp-cta" id="sp-custom-integration">
            <div className="sp-cta-inner">
              <div className="sp-cta-badges">
                <span className="sp-cta-badge">Custom API Integration</span>
                <span className="sp-cta-badge">On-Premise Available</span>
                <span className="sp-cta-badge">Dedicated Support</span>
              </div>
              <h2 className="sp-cta-title">Ready to Transform Your Operations?</h2>
              <p className="sp-cta-sub">Schedule a private demo with our enterprise team. We'll map your current workflows, identify compliance gaps, and show you how Sutana ERP integrates with your existing systems — including custom API integration for proprietary software.</p>
              <div className="sp-cta-actions">
                <Link to="/contact?interest=demo" className="sp-btn-primary sp-btn-demo" id="sp-schedule-demo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Schedule a Demo
                </Link>
                <Link to="/contact?interest=sales" className="sp-btn-outline-white" id="sp-contact-sales">Contact Sales</Link>
              </div>
            </div>
          </section>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
};

export const PublicNav = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [galleryDropdownOpen, setGalleryDropdownOpen] = useState(false);
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        <div className="pub-logo-modern" onClick={() => navigate('/')}>
          <BrandIcon />
          <span>SUTANA</span>
        </div>

        <nav className="pub-nav-center-modern">
          <div className="pub-dropdown-wrapper" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
            <button type="button" className={`pub-link-modern pub-link-trigger ${dropdownOpen ? 'active' : ''}`} onClick={() => setDropdownOpen(v => !v)} aria-haspopup="true" aria-expanded={dropdownOpen}>
              Services
              <svg className="pub-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {dropdownOpen && (
              <div className="pub-dropdown-grid" role="menu">
                <Link to="/services" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><span style={{fontSize:16}}>📋</span></span><span>All Services</span></Link>
                <div className="pub-dropdown-divider" />
                <Link to="/services/printing" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><Printer size={18} strokeWidth={2} /></span><span>Commercial Printing</span></Link>
                <Link to="/services/pharmacy" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><Pill size={18} strokeWidth={2} /></span><span>Pharmacy &amp; Health</span></Link>
                <Link to="/fleet-gallery" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><Car size={18} strokeWidth={2} /></span><span>Car Rental</span></Link>
                <Link to="/services/farming" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><Wheat size={18} strokeWidth={2} /></span><span>Farming &amp; Agriculture</span></Link>
                <Link to="/services/retail" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><Store size={18} strokeWidth={2} /></span><span>Retail Store</span></Link>
                <Link to="/services/finance" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><span style={{fontSize:16}}>🏦</span></span><span>Finance &amp; Accounting</span></Link>
                <Link to="/services/inventory" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><span style={{fontSize:16}}>📦</span></span><span>Inventory &amp; Store</span></Link>
                <Link to="/services/sales" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><span style={{fontSize:16}}>🛒</span></span><span>Sales &amp; POS</span></Link>
                <Link to="/services/purchase" className="pub-dropdown-item" onClick={() => setDropdownOpen(false)}><span className="pub-dropdown-icon"><span style={{fontSize:16}}>🚚</span></span><span>Purchase &amp; Procurement</span></Link>
              </div>
            )}
          </div>
          <div className="pub-dropdown-wrapper" onMouseEnter={() => setGalleryDropdownOpen(true)} onMouseLeave={() => setGalleryDropdownOpen(false)}>
            <span className={`pub-link-modern ${galleryDropdownOpen ? 'active' : ''}`}>
              Gallery
              <svg className="pub-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            {galleryDropdownOpen && (
              <div className="pub-dropdown-grid">
                <Link to="/gallery/workers" className="pub-dropdown-item" onClick={() => setGalleryDropdownOpen(false)}><span className="pub-dropdown-icon"><Users size={18} strokeWidth={2} /></span><span>Sutana Workers &amp; Workplace</span></Link>
                <Link to="/gallery/cars" className="pub-dropdown-item" onClick={() => setGalleryDropdownOpen(false)}><span className="pub-dropdown-icon"><Car size={18} strokeWidth={2} /></span><span>Cars</span></Link>
                <Link to="/gallery/other" className="pub-dropdown-item" onClick={() => setGalleryDropdownOpen(false)}><span className="pub-dropdown-icon"><Folder size={18} strokeWidth={2} /></span><span>Other</span></Link>
              </div>
            )}
          </div>
          <Link to="/about" className="pub-link-modern">About Us</Link>
          <button className="pub-link-btn" onClick={() => navigate('/track-order')}>Track Order</button>
          <div className="pub-search-bar">
            <svg className="pub-search-bar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="pub-search-bar-input" placeholder="Search Sutana..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearchKey} />
          </div>
          <div className="pub-dropdown-wrapper" onMouseEnter={() => setNewsDropdownOpen(true)} onMouseLeave={() => setNewsDropdownOpen(false)}>
            <span className={`pub-link-modern ${newsDropdownOpen ? 'active' : ''}`}>
              News
              <svg className="pub-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            {newsDropdownOpen && (
              <div className="pub-dropdown-grid">
                <Link to="/news/notice" className="pub-dropdown-item" onClick={() => setNewsDropdownOpen(false)}><span className="pub-dropdown-icon"><Bell size={18} strokeWidth={2} /></span><span>Notice</span></Link>
                <Link to="/news/video" className="pub-dropdown-item" onClick={() => setNewsDropdownOpen(false)}><span className="pub-dropdown-icon"><Video size={18} strokeWidth={2} /></span><span>Video</span></Link>
                <Link to="/news/gallery" className="pub-dropdown-item" onClick={() => setNewsDropdownOpen(false)}><span className="pub-dropdown-icon"><GalleryHorizontal size={18} strokeWidth={2} /></span><span>Gallery</span></Link>
              </div>
            )}
          </div>
        </nav>

        <div className="pub-nav-right-modern">
          <button className="pub-btn-ghost-modern" onClick={() => navigate('/login')}>Login</button>
          <button className="pub-btn-get-started" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </div>
    </header>
  );
};

export const PublicFooter = () => (
  <footer className="pub-footer">
    <div className="pub-footer-main">
      <div className="pub-footer-brand">
        <span className="pub-footer-logo">SUTANA</span>
        <p className="pub-footer-brand-sub">The definitive operating system for the modern Ethiopian enterprise, from production to point-of-sale.</p>
        <div className="pub-footer-socials">
          <a href="mailto:info@sutana.et" className="pub-footer-social" title="Email" aria-label="Email">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
          <a href="https://t.me/sutana" className="pub-footer-social" title="Telegram" aria-label="Telegram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </a>
          <a href="#" className="pub-footer-social" title="LinkedIn" aria-label="LinkedIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>
      </div>
      <div className="pub-footer-col">
        <strong className="pub-footer-col-title">PRODUCT</strong>
        <Link to="/services">Services</Link>
        <Link to="/about">Integrations</Link>
        <Link to="/track-order">Track Order</Link>
        <Link to="/about">ERP Roadmap</Link>
      </div>
      <div className="pub-footer-col">
        <strong className="pub-footer-col-title">COMPANY</strong>
        <Link to="/about">About Us</Link>
        <Link to="/">News</Link>
        <Link to="/contact">Support</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div className="pub-footer-col">
        <strong className="pub-footer-col-title">LEGAL</strong>
        <span className="pub-footer-link-muted">Privacy Policy</span>
        <span className="pub-footer-link-muted">Terms of Service</span>
        <span className="pub-footer-link-muted">Compliance</span>
      </div>
    </div>
    <div className="pub-footer-bottom">
                  <span>© {new Date().getFullYear()} Sutana Enterprise Management System. Built for Ethiopia.</span>
      <div className="pub-footer-bottom-right">
        <span className="pub-footer-locale">🌐 English (ET)</span>
        <span className="pub-footer-locale">☀ Appearance</span>
      </div>
    </div>
  </footer>
);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="public-page">
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '40px 24px',
        background: 'linear-gradient(160deg, #EEF2FF 0%, #F0FDF4 50%, #FEF2F2 100%)',
      }}>
        <div style={{
          width: '100%', maxWidth: 640,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {services.map((s, i) => (
            <ServiceCard key={i} service={s} index={i} isVisible={visible} />
          ))}
        </div>

        <div style={{
          marginTop: 36, display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 0.6s 0.6s',
        }}>
          <button onClick={() => navigate('/about')} style={{
            padding: '12px 28px', border: `2px solid ${NAVY}`, borderRadius: 12,
            background: 'transparent', color: NAVY, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NAVY; }}>
            About Us
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '12px 28px', border: 'none', borderRadius: 12,
            background: NAVY, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;

