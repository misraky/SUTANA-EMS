import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from './ServicesPage';
import authService from '../../services/authService';
import './PublicLayout.css';
import './LandingPage.css';

/* ── Animated counter hook ── */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const str = String(target);
    const numericMatch = str.match(/([0-9.]+)/);
    const numericTarget = numericMatch ? parseFloat(numericMatch[1]) : 0;
    const isFloat = numericMatch && numericMatch[1].includes('.');
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * numericTarget;
      setCount(isFloat ? current.toFixed(1) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(numericTarget);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ── Stat item with animated counter ── */
const StatItem = ({ num, lbl, visible }) => {
  const cleaned = String(num).replace(/[^0-9.]/g, '');
  const isSymbol = isNaN(parseFloat(cleaned));
  const count = useCountUp(num, 1600, visible && !isSymbol);
  const match = String(num).match(/^([^0-9]*)([0-9.]*)(.*)$/);
  const display = isSymbol ? num : (match[1] + count + match[3]);
  return (
    <div className="lp-stat-item">
      <span className="lp-stat-num">{display}</span>
      <span className="lp-stat-lbl">{lbl}</span>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [statsVisible, setStatsVisible] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const statsRef = useRef(null);

  /* Intersection observer for stats counter */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const industryServices = [
    { icon: '🖨️', label: 'Commercial Printing', to: '/services/printing' },
    { icon: '💊', label: 'Pharmacy & Health',    to: '/services/pharmacy' },
    { icon: '🚗', label: 'Car Rental',           to: '/fleet-gallery' },
    { icon: '🌾', label: 'Farming & Agriculture',to: '/services/farming' },
    { icon: '🏪', label: 'Retail Store',         to: '/services/retail' },
  ];

  const engineeringFeatures = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/>
        </svg>
      ),
      title: 'High Performance',
      desc: 'Optimized for low-bandwidth environments without compromising on feature density or response times.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      title: 'Localized for Ethiopia',
      desc: 'Full support for ETB, Ethiopian calendar integrations, and local business practices including VAT reporting.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Enterprise Security',
      desc: 'Bank-grade encryption for all financial data and multi-factor authentication for every user profile.',
    },
  ];

  const stats = [
    { num: '500+', lbl: 'Enterprises Served' },
    { num: '10+',  lbl: 'Industries Covered' },
    { num: '99.9%', lbl: 'Data Accuracy' },
    { num: '24/7', lbl: 'Local Support' },
  ];

  const trustedBy = [
    { name: 'Bank of Abyssinia', icon: '🏦' },
    { name: 'Ethiopian Airlines', icon: '✈️' },
    { name: 'Safaricom ET', icon: '📡' },
    { name: 'EEPCO', icon: '⚡' },
  ];

  return (
    <div className="lp-root">
      <PublicNav />

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="lp-hero">


        <div className="lp-hero-inner">
          {/* Left — copy */}
          <div className="lp-hero-copy">
            <span className="lp-pill-badge">🇪🇹 Built for Ethiopia · Loved by Teams</span>

            <h1 className="lp-hero-h1">
              The all-in-one{' '}
              <span className="lp-accent-text">Enterprise<br/>Platform</span>{' '}
              your business deserves.
            </h1>

            <p className="lp-hero-sub">
              Stop juggling spreadsheets and disconnected apps. Sutana unifies
              printing production, sales, inventory, procurement, and finance in
              one intelligent platform — built for Ethiopia, loved by teams.
            </p>

            <div className="lp-hero-actions">
              <Link
                to="/auth/register"
                className="lp-btn-primary"
                id="lp-cta-start-free"
              >
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <button
                className="lp-btn-watch"
                onClick={() => setVideoModal(true)}
                id="lp-cta-watch-demo"
              >
                <span className="lp-play-circle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </span>
                Watch Demo
              </button>
            </div>

            <div className="lp-social-proof">
              <div className="lp-avatar-stack">
                {['#4F46E5','#0EA5E9','#10B981','#F59E0B'].map((c, i) => (
                  <span key={i} className="lp-avatar" style={{ background: c, zIndex: 4 - i }}>
                    {['T','H','M','A'][i]}
                  </span>
                ))}
              </div>
              <span className="lp-social-text">
                Joined by <strong>2,400+ businesses</strong> across Addis Ababa and beyond.
              </span>
            </div>
          </div>

          {/* Right — dashboard card */}
          <div className="lp-hero-visual">
            <div className="lp-dashboard-card" id="lp-dashboard-card">
              {/* Card header */}
              <div className="lp-dc-header">
                <span className="lp-dc-brand">SUTANA EMS</span>
                <span className="lp-dc-badge lp-dc-badge--up">↑ 18% vs last month</span>
              </div>

              {/* Revenue stat */}
              <div className="lp-dc-stat-row">
                <div>
                  <span className="lp-dc-label">Revenue Today</span>
                  <span className="lp-dc-value">ETB 284K</span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="lp-dc-chart">
                {[42, 65, 48, 78, 55, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className="lp-dc-bar"
                    style={{ '--bar-h': h + '%', animationDelay: i * 0.08 + 's' }}
                  />
                ))}
              </div>

              {/* Module chips */}
              <div className="lp-dc-chips">
                {[
                  { icon: '📦', label: 'Inventory' },
                  { icon: '💰', label: 'Finance' },
                  { icon: '🛒', label: 'POS' },
                ].map(({ icon, label }) => (
                  <div key={label} className="lp-dc-chip">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div className="lp-float-badge lp-float-badge--tl">
              <span className="lp-float-dot lp-float-dot--green" />
              99.98% Uptime
            </div>
            <div className="lp-float-badge lp-float-badge--br">
              🚀 Go live in 1 week
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ TRUSTED BY ════════════════════ */}
      <section className="lp-trusted">
        <p className="lp-trusted-label">Trusted by Leading Ethiopian Enterprises</p>
        <div className="lp-trusted-logos">
          {trustedBy.map(({ name, icon }) => (
            <div key={name} className="lp-trusted-item">
              <span className="lp-trusted-icon">{icon}</span>
              <span className="lp-trusted-name">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ INDUSTRY FOCUS ════════════════════ */}
      <section className="lp-section lp-industry">
        <div className="lp-container lp-industry-inner">
          {/* Left */}
          <div className="lp-industry-copy">
            <h2 className="lp-section-title">Industry Focus</h2>
            <p className="lp-section-sub">
              Sutana provides specialized enterprise management tools tailored
              for Ethiopia's most vital sectors. Our platform adapts to your
              specific operational DNA, ensuring efficiency from day one.
            </p>

            <div className="lp-industry-grid">
              {industryServices.map(({ icon, label, to }) => (
                <Link key={label} to={to} className="lp-industry-chip" id={`lp-industry-${label.replace(/\s+/g,'-').toLowerCase()}`}>
                  <span className="lp-industry-icon">{icon}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <Link to="/services" className="lp-btn-outline" id="lp-explore-services">
              Explore All Services
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Right — visual mockup */}
          <div className="lp-industry-visual">
            <div className="lp-mockup-card">
              <div className="lp-mockup-header">
                <div className="lp-mockup-dot" style={{ background: '#EF4444' }} />
                <div className="lp-mockup-dot" style={{ background: '#F59E0B' }} />
                <div className="lp-mockup-dot" style={{ background: '#10B981' }} />
                <span className="lp-mockup-title">Analytics Dashboard</span>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mockup-row">
                  {['#E8F4FE','#EEF2FF','#F0FDF4'].map((bg, i) => (
                    <div key={i} className="lp-mockup-block" style={{ background: bg }} />
                  ))}
                </div>
                <div className="lp-mockup-line" />
                <div className="lp-mockup-line lp-mockup-line--short" />
                <div className="lp-mockup-bars">
                  {[55, 80, 40, 95, 65, 75].map((h, i) => (
                    <div key={i} className="lp-mockup-bar-wrap">
                      <div className="lp-mockup-bar" style={{ height: h + '%' }} />
                    </div>
                  ))}
                </div>
                <div className="lp-mockup-line lp-mockup-line--short" style={{ marginTop: 12 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ ENGINEERED ════════════════════ */}
      <section className="lp-engineered">
        <div className="lp-container lp-engineered-inner">
          {/* Left — copy */}
          <div className="lp-engineered-copy">
            <h2 className="lp-engineered-title">
              Engineered for the<br/>Ethiopian Context
            </h2>

            <div className="lp-eng-features">
              {engineeringFeatures.map((f, i) => (
                <div key={i} className="lp-eng-feature">
                  <div className="lp-eng-icon">{f.icon}</div>
                  <div>
                    <h4 className="lp-eng-feature-title">{f.title}</h4>
                    <p className="lp-eng-feature-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/contact" className="lp-btn-outline lp-btn-outline--light" id="lp-request-quote">
              Request a Custom Quote
            </Link>
          </div>

          {/* Right — laptop image */}
          <div className="lp-engineered-visual">
            {/* Uptime badge */}
            <div className="lp-uptime-badge">
              <span className="lp-uptime-label">UPTIME STATUS</span>
              <span className="lp-uptime-value">99.98%</span>
              <div className="lp-uptime-bars">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`lp-uptime-bar ${i < 11 ? 'lp-uptime-bar--green' : ''}`} />
                ))}
              </div>
            </div>

            {/* Laptop mockup */}
            <div className="lp-laptop">
              <div className="lp-laptop-screen">
                <div className="lp-laptop-notch" />
                <div className="lp-laptop-content">
                  <div className="lp-laptop-sidebar">
                    {['📊','📦','💰','🛒','⚙️'].map((icon, i) => (
                      <div key={i} className={`lp-laptop-nav-item ${i === 0 ? 'active' : ''}`}>{icon}</div>
                    ))}
                  </div>
                  <div className="lp-laptop-main">
                    <div className="lp-laptop-chart-area">
                      {[60, 80, 50, 90, 70, 85, 55].map((h, i) => (
                        <div key={i} className="lp-laptop-bar" style={{ height: h + '%' }} />
                      ))}
                    </div>
                    <div className="lp-laptop-stats">
                      {[
                        { label: 'Revenue', val: 'ETB 1.2M' },
                        { label: 'Orders', val: '847' },
                      ].map(({ label, val }) => (
                        <div key={label} className="lp-laptop-stat">
                          <span className="lp-laptop-stat-label">{label}</span>
                          <span className="lp-laptop-stat-val">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-laptop-base">
                <div className="lp-laptop-camera" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS BAR ════════════════════ */}
      <div className="lp-stats-bar" ref={statsRef}>
        {stats.map((s, i) => (
          <StatItem key={i} num={s.num} lbl={s.lbl} visible={statsVisible} />
        ))}
      </div>

      {/* ════════════════════ CTA ════════════════════ */}
      <section className="lp-cta" id="lp-cta-section">
        <div className="lp-container lp-cta-inner">
          <h2 className="lp-cta-title">
            Ready to modernize your<br />operations?
          </h2>
          <p className="lp-cta-sub">
            Join the next generation of Ethiopian businesses scaling with intelligence.
          </p>
          <div className="lp-cta-actions">
            <Link to="/login" className="lp-btn-primary lp-btn-primary--dark" id="lp-cta-get-started">
              Get Started Now
            </Link>
            <Link to="/contact" className="lp-btn-outline" id="lp-cta-schedule-demo">
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />

      {/* ════════════════════ VIDEO MODAL ════════════════════ */}
      {videoModal && (
        <div className="lp-modal-overlay" onClick={() => setVideoModal(false)} id="lp-video-modal">
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setVideoModal(false)}>✕</button>
            <div className="lp-modal-content">
              <div className="lp-modal-placeholder">
                <div className="lp-modal-play-btn">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <circle cx="30" cy="30" r="28" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
                    <polygon points="24,18 44,30 24,42" fill="rgba(255,255,255,0.6)"/>
                  </svg>
                </div>
                <p className="lp-modal-placeholder-title">Product Demo</p>
                <span className="lp-modal-placeholder-badge">Live Walkthrough</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { PublicNav } from './ServicesPage';
import './PublicLayout.css';
import Carousel from './Carousel';
import EventSection from './EventSection';
import {
  StatsSection, CapabilitiesSection, GettingStartedSection,
  WhySutanaSection, TestimonialsSection, CTASection
} from './ModernSections';

const LandingPage = () => (
  <div className="public-page cnx-page">
    <PublicNav />
    <Carousel />
    <EventSection />
    <StatsSection />
    <CapabilitiesSection />
    <GettingStartedSection />
    <WhySutanaSection />
    <TestimonialsSection />
    <CTASection />
  </div>
);

export default LandingPage;

export default LandingPage;
