import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './PublicLayout.css';
import ToggleSection from './ToggleSection';

const ServicesPage = () => {
  const navigate = useNavigate();
  const services = [
    {
      icon: '🖨️',
      title: 'Print Production Management',
      desc: 'End-to-end printing workflow: order intake, production queues, quality checks, and tax-compliant receipt generation — all in one place.',
      detail: 'Track every job from the moment a client places an order to the moment it leaves your door. Assign jobs to operators, monitor production stages in real time, flag quality issues before they reach the client, and auto-generate VAT-compliant receipts. Supervisors get a live production board; management gets a throughput dashboard with bottleneck alerts.',
      color: '#2563eb',
      bg: '#eff6ff',
      benefits: ['Real-time job board', 'Quality checkpoint system', 'Auto receipt generation', 'Operator workload visibility'],
    },
    {
      icon: '💰',
      title: 'Financial Accounting',
      desc: 'Real-time expense tracking, payment recording, ledger management, and comprehensive financial reports with instant export.',
      detail: 'Replace your manual ledger books with a fully digital, real-time accounting system. Record expenses, track payments received and owed, reconcile accounts, and generate profit & loss statements, balance sheets, and cash flow reports in seconds. Close your month in hours instead of days, and walk into every audit with complete confidence.',
      color: '#0ea5e9',
      bg: '#f0f9ff',
      benefits: ['Real-time P&L reports', 'Automated reconciliation', 'Multi-account ledger', 'Instant export to PDF/Excel'],
    },
    {
      icon: '📦',
      title: 'Inventory & Store Management',
      desc: 'Live stock-level monitoring, stock-movement history, reorder alerts, and multi-warehouse support.',
      detail: 'Eliminate stock-outs and costly over-ordering with intelligent inventory management. Monitor stock levels across multiple locations in real time, track every movement in and out with a full audit trail, set automatic reorder thresholds, and receive instant alerts when levels drop below your defined minimums. Your store workers and management team stay perfectly synchronized.',
      color: '#10b981',
      bg: '#f0fdf4',
      benefits: ['Multi-warehouse support', 'Automated reorder alerts', 'Full movement audit trail', 'Live stock dashboard'],
    },
    {
      icon: '🛒',
      title: 'Sales & Point of Sale',
      desc: 'Powerful POS interface, customer management, sales analytics, and automated reporting for your retail floor.',
      detail: 'Designed for speed at the counter and intelligence in the back office. Your cashiers get a clean, fast POS interface that reduces transaction time. Management gets granular sales analytics — by product, by cashier, by time period. Customer accounts, loyalty tracking, and automated daily summaries make SUTANA the last POS system you will ever need.',
      color: '#f59e0b',
      bg: '#fffbeb',
      benefits: ['Fast, intuitive POS UI', 'Customer account management', 'Daily sales summaries', 'Per-product analytics'],
    },
    {
      icon: '🚚',
      title: 'Purchase & Procurement',
      desc: 'Streamlined vendor management, purchase-order lifecycle tracking, delivery confirmation, and supplier analytics.',
      detail: 'Never lose track of a purchase order again. Create POs in seconds, send them to suppliers directly from the system, track expected delivery dates, confirm goods received, and automatically update inventory. Rate your suppliers on delivery accuracy and product quality, and use those ratings to make smarter procurement decisions month after month.',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      benefits: ['Digital PO creation & tracking', 'Supplier performance ratings', 'Auto inventory update on receipt', 'Delivery alert system'],
    },
    {
      icon: '📊',
      title: 'Executive Analytics',
      desc: 'CEO-level dashboards with key performance metrics, trend charts, and cross-department insights for data-driven decisions.',
      detail: 'Built specifically for business leaders who need the full picture, not just one department\'s view. The CEO dashboard aggregates data from every module — sales revenue, inventory value, production throughput, purchase spend, and financial position — into one beautifully organized, real-time command center. Compare performance across periods, identify trends, and act on insights that were previously buried in spreadsheets.',
      color: '#ef4444',
      bg: '#fff1f2',
      benefits: ['Cross-department KPI view', 'Period-over-period comparisons', 'Trend charts & forecasting', 'One-click executive reports'],
    },
  ];

  const [expanded, setExpanded] = useState(null);

  return (
    <div className="public-page">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="pub-hero pub-hero--slim">
        <div className="pub-hero-inner">
          <span className="pub-badge">Our Services</span>
          <h1>Everything Your Business Needs, Under One Roof</h1>
          <p>
            SUTANA brings together all enterprise operations under one powerful, unified platform.
            No more jumping between apps, no more manual data reconciliation, no more information silos.
            Every module is deeply integrated — when a sale happens, inventory updates instantly, finance
            records it automatically, and the CEO dashboard reflects it in real time.
          </p>
        </div>
      </section>

      {/* ── Services List ── */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="features-list-pub">
            {services.map((s, i) => (
              <div className="feature-item-pub feature-item-expandable" key={i}>
                <div className="feature-item-icon" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <div className="feature-item-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <p style={{ marginTop: '10px', color: '#555', lineHeight: '1.75' }}>{s.detail}</p>
                  <div className="service-benefits">
                    {s.benefits.map((b, j) => (
                      <span key={j} className="service-benefit-tag" style={{ borderColor: s.color + '44', color: s.color, background: s.color + '10' }}>
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integration Banner ── */}
      <section className="pub-section pub-section--alt">
        <div className="pub-container">
          <ToggleSection
            label="The Power of Integration"
            title="Six modules."
            titleAccent="One source of truth."
          >
            <p className="cnx-toggle-desc">
              What makes SUTANA truly powerful is not any single module — it is the way they all work together.
              When your cashier completes a sale, inventory automatically decrements. When stock hits a reorder
              threshold, a purchase requisition is created. When a supplier invoice is received, finance records it
              automatically. Every action in one module ripples intelligently through the entire system.
              This is not just software — this is a nervous system for your business.
            </p>
            <div className="integration-flow" style={{ paddingTop: '16px' }}>
              {['🛒 Sales', '→', '📦 Inventory', '→', '🚚 Procurement', '→', '💰 Finance', '→', '📊 Analytics'].map((item, i) => (
                <span key={i} className={item === '→' ? 'integration-arrow' : 'integration-node'}>
                  {item}
                </span>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pub-cta">
        <div className="pub-container pub-cta-inner">
          <h2>Ready to get started?</h2>
          <p>
            Join forward-thinking Ethiopian businesses using SUTANA to streamline operations, eliminate
            manual errors, and gain the real-time visibility they need to lead with confidence.
            Your dashboard is waiting.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
            <Link to="/login" className="pub-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              Sign In to Your Dashboard →
            </Link>
            <Link to="/contact" className="pub-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              Request a Demo
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export const PublicNav = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('sutana-theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('sutana-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="pub-nav">
      <div className="pub-nav-inner">
        <div className="pub-logo" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="SUTANA" onError={e => e.target.style.display='none'} />
          <span>SUTANA</span>
        </div>
        <button className="pub-nav-toggle" onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
        <nav className={`pub-nav-links ${open ? 'open' : ''}`}>
          <Link to="/services" onClick={() => setOpen(false)}>Services</Link>
          <Link to="/about" onClick={() => setOpen(false)}>About & Future</Link>
          <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <button 
            className="pub-btn-outline" 
            onClick={toggleTheme} 
            style={{ padding: '8px 12px', border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/login" className="pub-btn-signin" onClick={() => setOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            Sign In
          </Link>
        </nav>
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
          <Link to="/about">About & Future</Link>
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

export default ServicesPage;
