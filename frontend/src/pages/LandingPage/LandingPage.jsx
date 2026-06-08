import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav, PublicFooter } from './ServicesPage';
import authService from '../../services/authService';
import './PublicLayout.css';
import ToggleSection from './ToggleSection';

const LandingPage = () => {
  const navigate = useNavigate();
  const modules = [
    'Inventory', 'Finance', 'Sales / POS', 'Procurement',
    'Printing', 'Analytics', 'HR & Access', 'Reporting',
  ];
  const features = [
    {
      icon: '📦',
      title: 'Inventory Control',
      desc: 'Real-time stock tracking with full movement history, automated reorder alerts, and multi-location warehouse support. Say goodbye to stock-outs and costly over-ordering — SUTANA keeps your shelves perfectly balanced with intelligent demand insights.',
      tag: 'Store',
      color: '#4F46E5',
    },
    {
      icon: '💰',
      title: 'Financial Accounting',
      desc: 'From daily expense recording to full ledger management, SUTANA handles your entire financial workflow. Generate instant profit & loss reports, track payments across customers and vendors, and maintain audit-ready records — all with one click.',
      tag: 'Finance',
      color: '#0EA5E9',
    },
    {
      icon: '🖨️',
      title: 'Printing Workflow',
      desc: 'Manage the complete production lifecycle — from client order intake through production queues, quality control checkpoints, and final tax-compliant receipt generation. Reduce turnaround times and eliminate miscommunications between departments.',
      tag: 'Production',
      color: '#8B5CF6',
    },
    {
      icon: '📊',
      title: 'Executive Analytics',
      desc: 'Purpose-built CEO dashboards deliver real-time KPIs, trend analysis, and cross-department performance insights. Make data-driven decisions with confidence — compare periods, spot bottlenecks, and track your most important business metrics at a glance.',
      tag: 'Analytics',
      color: '#F59E0B',
    },
    {
      icon: '🛒',
      title: 'Point of Sale',
      desc: 'A fast, intuitive POS system designed for the Ethiopian retail environment. Manage customer accounts, apply discounts, track daily sales targets, and generate receipts — all while syncing inventory and finance in the background, automatically.',
      tag: 'Sales',
      color: '#10B981',
    },
    {
      icon: '🚚',
      title: 'Procurement',
      desc: 'Streamline your entire procurement cycle: create purchase orders, track supplier deliveries, confirm goods received, and monitor vendor performance. Full lifecycle visibility from requisition to payment means you never lose track of a purchase again.',
      tag: 'Purchase',
      color: '#EF4444',
    },
  ];
  const whyItems = [
    {
      icon: '🔒',
      title: 'Secure & Role-Based Access',
      desc: 'Granular, military-grade access control ensures every user — Admins, Finance, Sales, Store Workers, and CEOs — sees only what is relevant to their role. Full audit trails record every action, giving you complete accountability across your organization.',
    },
    {
      icon: '🌍',
      title: 'Locally Tailored for Ethiopia',
      desc: 'ETB currency support, Ethiopian tax compliance frameworks, and an interface built around the day-to-day realities of Ethiopian business. We do not just translate features — we rethink them for your market, your culture, and your customers.',
    },
    {
      icon: '⚡',
      title: 'Fast & Always Reliable',
      desc: 'Sub-100ms API responses backed by a robust MySQL and Node.js infrastructure, with 99.9% uptime SLA. Whether you are processing a sale at peak hour or generating month-end reports, SUTANA never keeps you waiting.',
    },
    {
      icon: '📱',
      title: 'Works on Every Device',
      desc: 'Fully responsive across desktop, tablet, and mobile — wherever your team is working. Whether your manager is checking analytics from the field or your cashier is processing a POS sale on a tablet, the experience is seamless and fast.',
    },
  ];
  const stats = [
    { num: '6+', lbl: 'Enterprise Modules' },
    { num: '99.9%', lbl: 'Uptime SLA' },
    { num: '<100ms', lbl: 'API Response' },
    { num: '∞', lbl: 'Scalability' },
  ];
  const howSteps = [
    {
      step: '01',
      title: 'Request Access',
      desc: 'Contact us or sign in with your credentials. Your system administrator sets up your account and assigns the exact role and permissions your position requires — nothing more, nothing less.',
      icon: '🔑',
    },
    {
      step: '02',
      title: 'Configure Your Modules',
      desc: 'Enable only the modules your business needs today. Start with Sales and Inventory, then activate Finance and Procurement as you grow. SUTANA scales with you — no expensive re-implementation required.',
      icon: '⚙️',
    },
    {
      step: '03',
      title: 'Import Your Data',
      desc: 'Migrate your existing records — products, customers, suppliers, and historical financials — with our guided import tools. Our onboarding team is available to assist every step of the way.',
      icon: '📥',
    },
    {
      step: '04',
      title: 'Go Live & Grow',
      desc: 'Your team starts working in SUTANA from day one. Real-time dashboards, automated alerts, and instant reports give leadership unprecedented visibility, while your staff benefits from a system designed to make their jobs easier.',
      icon: '🚀',
    },
  ];
  const testimonials = [
    {
      quote: "Before SUTANA, we were running three different spreadsheets for inventory, finance, and sales. Now everything is connected. Our month-end close time dropped from 5 days to just a few hours.",
      name: "Tigist Alemu",
      role: "Finance Director, Addis Trading PLC",
      avatar: "TA",
      color: "#4F46E5",
    },
    {
      quote: "The CEO dashboard is exactly what I needed. I can see revenue, inventory status, and production output at a glance — anytime, from anywhere. This is what modern business management looks like.",
      name: "Habtamu Bekele",
      role: "CEO, Bekele Printing & Publishing",
      avatar: "HB",
      color: "#0EA5E9",
    },
    {
      quote: "Our purchase department used to chase down paper orders. Now with SUTANA's procurement module, every order is tracked, every supplier is rated, and we get automatic alerts when deliveries are delayed.",
      name: "Meseret Girma",
      role: "Operations Manager, Girma Enterprises",
      avatar: "MG",
      color: "#10B981",
    },
  ];

  return (
    <div className="public-page cnx-page">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="cnx-hero">
        <div className="cnx-blob cnx-blob--1" />
        <div className="cnx-blob cnx-blob--2" />
        <div className="cnx-hero-inner">
          <span className="cnx-pill-badge">🇪🇹 Built for Ethiopia · Loved by Teams</span>
          <h1 className="cnx-hero-title">
            The all-in-one<br />
            <span className="cnx-gradient-text">Enterprise Platform</span><br />
            your business deserves.
          </h1>
          <p className="cnx-hero-sub">
            Stop juggling spreadsheets and disconnected apps. SUTANA unifies printing production,
            sales, inventory, procurement, and finance in one intelligent platform — built from
            the ground up for Ethiopia's fast-growing businesses.
          </p>
          <div className="cnx-module-tags">
            {modules.map((m) => (
              <span key={m} className="cnx-module-tag">{m}</span>
            ))}
          </div>
          <div className="cnx-hero-actions">
            <button className="cnx-btn-primary" onClick={() => navigate('/login')}>
              Get Started Free →
            </button>
            <button className="cnx-btn-ghost" onClick={() => navigate('/services')}>
              Explore Services
            </button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="cnx-hero-visual">
          <div className="cnx-phone-card">
            <div className="cnx-phone-header">
              <span className="cnx-phone-dot" />
              <span className="cnx-phone-dot cnx-phone-dot--2" />
              <span className="cnx-phone-dot cnx-phone-dot--3" />
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>SUTANA EMS</span>
            </div>
            <div className="cnx-phone-stat-row">
              <div className="cnx-phone-stat">
                <span className="cnx-phone-stat-num">ETB 284K</span>
                <span className="cnx-phone-stat-lbl">Revenue Today</span>
              </div>
              <div className="cnx-phone-stat">
                <span className="cnx-phone-stat-num" style={{ color: '#10B981' }}>↑ 18%</span>
                <span className="cnx-phone-stat-lbl">vs last month</span>
              </div>
            </div>
            <div className="cnx-phone-chart">
              {[40, 65, 48, 72, 58, 85, 70].map((h, i) => (
                <div key={i} className="cnx-chart-bar" style={{ height: h + '%' }} />
              ))}
            </div>
            <div className="cnx-phone-modules">
              {['📦 Inventory', '💰 Finance', '🛒 POS', '🚚 Purchase'].map((m) => (
                <span key={m} className="cnx-phone-mod-chip">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="cnx-stats-bar">
        {stats.map((s, i) => (
          <div className="cnx-stat-item" key={i}>
            <span className="cnx-stat-num">{s.num}</span>
            <span className="cnx-stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section className="cnx-section">
        <div className="pub-container">
          <ToggleSection
            label="Platform Capabilities"
            title="Six modules. One source of truth."
            titleAccent="Everything you need to scale."
          >
            <p className="cnx-toggle-desc">Six deeply integrated modules, one login, zero data silos. Each module is powerful on its own — together, they create a business operating system that gives your entire organization a single source of truth.</p>
            <div className="cnx-features-grid">
              {features.map((f, i) => (
                <div className="cnx-feature-card" key={i}>
                  <div className="cnx-feature-icon" style={{ background: f.color + '15', color: f.color }}>
                    {f.icon}
                  </div>
                  <span className="cnx-feature-tag" style={{ color: f.color, background: f.color + '10' }}>
                    {f.tag}
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="cnx-section cnx-section--alt">
        <div className="pub-container">
          <ToggleSection
            label="Getting Started"
            title="Up and running in"
            titleAccent="4 simple steps"
          >
            <p className="cnx-toggle-desc">We have made onboarding as painless as possible. Most businesses are fully operational within their first week — with our team supporting you every step of the way.</p>
            <div className="cnx-how-grid">
              {howSteps.map((s, i) => (
                <div className="cnx-how-card" key={i}>
                  <div className="cnx-how-step">{s.step}</div>
                  <div className="cnx-how-icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── Why SUTANA ── */}
      <section className="cnx-section">
        <div className="pub-container">
          <ToggleSection
            label="Why SUTANA"
            title="Trusted by Growing Ethiopian Enterprises"
            titleAccent="Simplifying Operations, Empowering Growth"
          >
            <p className="cnx-toggle-desc">We understand the unique challenges of Ethiopian business — the infrastructure, the regulations, the culture. We did not just adapt a foreign product. We built SUTANA specifically for you, and we are committed to growing alongside you.</p>
            <div className="cnx-why-grid">
              {whyItems.map((w, i) => (
                <div className="cnx-why-card" key={i}>
                  <div className="cnx-why-icon">{w.icon}</div>
                  <div>
                    <h3>{w.title}</h3>
                    <p>{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="cnx-section cnx-section--alt">
        <div className="pub-container">
          <ToggleSection
            label="Success Stories"
            title="Businesses that transformed with SUTANA"
            titleAccent=""
          >
            <p className="cnx-toggle-desc">Real results from real Ethiopian businesses. These are the teams that chose to stop managing chaos and start managing growth.</p>
            <div className="cnx-testimonials-grid">
              {testimonials.map((t, i) => (
                <div className="cnx-testimonial-card" key={i}>
                  <div className="cnx-testimonial-quote">"</div>
                  <p className="cnx-testimonial-text">{t.quote}</p>
                  <div className="cnx-testimonial-author">
                    <div className="cnx-testimonial-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cnx-cta">
        <div className="cnx-cta-blob" />
        <div className="pub-container cnx-cta-inner">
          <span className="cnx-pill-badge cnx-pill-badge--light">Ready to transform?</span>
          <h2>Stop managing chaos.<br />Start managing growth.</h2>
          <p>Join forward-thinking Ethiopian businesses using SUTANA EMS to eliminate manual work, eliminate data silos, and gain real-time visibility into every corner of their operations. Your team will thank you.</p>
          <div className="cnx-cta-actions">
            <button className="cnx-btn-primary" onClick={() => navigate('/login')}>
              {authService.isAuthenticated() ? 'Go to Dashboard →' : 'Sign In Now →'}
            </button>
            <button className="cnx-btn-ghost cnx-btn-ghost--light" onClick={() => navigate('/contact')}>
              Talk to Our Team
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
export default LandingPage;

