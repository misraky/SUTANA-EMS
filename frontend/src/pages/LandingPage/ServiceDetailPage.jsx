import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ServiceDashboardLayout from './ServiceDashboardLayout';
import './ServiceDetail.css';

const TESTIMONIALS = [
  {
    text: "Sutana ERP transformed our entire operation. We've seen a 40% reduction in processing time across all departments.",
    author: "Abebech Tesfaye",
    role: "Operations Director, Addis Print PLC",
    color: "#0070F2"
  },
  {
    text: "The inventory module alone saved us millions in overstock costs. The predictive alerts are incredibly accurate.",
    author: "Dawit Hailu",
    role: "Supply Chain Manager, Ethio Pharma",
    color: "#7C3AED"
  },
  {
    text: "Going from fragmented spreadsheets to a unified ERP was seamless. The local compliance features are a game changer.",
    author: "Meron Alemu",
    role: "CFO, Sheger Retail Group",
    color: "#059669"
  }
];

function AnimatedStat({ value, label, desc, color }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="sdp-dark-stat-card" style={{ borderColor: visible ? color : 'rgba(255,255,255,0.1)' }}>
      <div
        className="sdp-dark-val"
        style={{ '--num': value, '--color': color }}
        data-visible={visible}
      >
        {visible ? value : '—'}
      </div>
      <div className="sdp-dark-lbl">{label}</div>
      {desc && <div className="sdp-dark-desc">{desc}</div>}
    </div>
  );
}

const ServiceDetailPage = ({ data }) => {
  const navigate = useNavigate();
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <ServiceDashboardLayout activeModule={data.title.replace('&', '').trim()}>
      <div className="sdp-dashboard-view" style={{ '--hero-color': data.heroColor, '--hero-bg': data.heroBg, '--hero-dark': data.heroColorDark }}>

        <section className="sdp-dash-hero">
          <div className="sdp-dash-hero-inner">
            <div className="sdp-hero-copy">
              <span className="sdp-hero-badge">{data.badge}</span>
              <h1 className="sdp-hero-title">
                {data.title}<br/>
                <span className="sdp-hero-accent">{data.accentTitle}</span>
              </h1>
              <p className="sdp-hero-subtitle">{data.subtitle}</p>

              <div className="sdp-hero-actions">
                <Link to={data.primaryCTALink} className="sdp-btn-primary">
                  {data.primaryCTA}
                </Link>
                <Link to="/contact" className="sdp-btn-secondary">
                  {data.secondaryCTA}
                </Link>
              </div>
            </div>

            <div className="sdp-hero-visual">
              <div className="sdp-mockup-card">
                <div className="sdp-mockup-header">
                  <div className="sdp-mockup-dots">
                    <span style={{background:'#EF4444'}}></span>
                    <span style={{background:'#F59E0B'}}></span>
                    <span style={{background:'#10B981'}}></span>
                  </div>
                </div>
                <div className="sdp-mockup-content">
                  <div className="sdp-mockup-stats-row">
                    <div className="sdp-stat-box">
                      <div className="sdp-stat-val">{data.heroStat ? data.heroStat.value : '98%'}</div>
                      <div className="sdp-stat-lbl">{data.heroStat ? data.heroStat.label : 'System Efficiency'}</div>
                    </div>
                    <div className="sdp-stat-box">
                      <div className="sdp-stat-val" style={{ color: '#10B981' }}>100%</div>
                      <div className="sdp-stat-lbl">Uptime Guarantee</div>
                    </div>
                  </div>
                  <div className="sdp-mockup-chart">
                    {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                      <div
                        key={i}
                        className="sdp-chart-bar"
                        style={{
                          '--h': h+'%',
                          animationDelay: `${i*0.1}s`,
                          backgroundColor: i % 2 === 0 ? 'var(--hero-color)' : '#94A3B8'
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="sdp-chart-label">Performance Trend (Last 7 Days)</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sdp-dash-features">
          <div className="sdp-features-header">
            <h2 className="sdp-section-title">{data.featuresTitle}</h2>
            <p className="sdp-section-sub">{data.featuresSubtitle}</p>
          </div>

          <div className="sdp-features-grid">
            {data.features.map((f, i) => (
              <div key={i} className="sdp-feature-card">
                <div className="sdp-feature-icon">{f.icon}</div>
                <h3 className="sdp-feature-title">{f.title}</h3>
                <p className="sdp-feature-desc">{f.desc}</p>
                {f.tags && f.tags.length > 0 && (
                  <div className="sdp-feature-tags">
                    {f.tags.map(t => (
                      <span key={t} className="sdp-feature-tag">{t}</span>
                    ))}
                  </div>
                )}
                <div className="sdp-feature-footer">
                  <Link to={f.link?.to || '/contact'} className="sdp-feature-link">
                    {f.link?.label || 'Explore Feature'} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sdp-dash-dark">
          <div className="sdp-dark-inner">
            <div className="sdp-dark-content">
              <h2>{data.dashboardTitle}</h2>
              <p>{data.dashboardSubtitle}</p>
              <ul className="sdp-dark-list">
                {data.dashboardItems.map((item, i) => (
                  <li key={i}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sdp-dark-stats-grid">
              {data.stats.map((stat, i) => (
                <AnimatedStat key={i} value={stat.value} label={stat.label} desc={stat.desc} color={data.heroColor} />
              ))}
            </div>
          </div>
        </section>

        {data.dashboardVisual && (
          <section className="sdp-dash-custom-visual">
            <div className="sdp-dark-inner" style={{ gridTemplateColumns: '1fr' }}>
              {data.dashboardVisual}
            </div>
          </section>
        )}

        <section className="sdp-dash-testimonials">
          <div className="sdp-features-header">
            <h2 className="sdp-section-title">Trusted by Industry Leaders</h2>
            <p className="sdp-section-sub">See how organizations across Ethiopia are transforming with Sutana ERP.</p>
          </div>
          <div className="sdp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="sdp-testimonial-card" style={{ borderTopColor: t.color }}>
                <div className="sdp-testimonial-quote">"</div>
                <p className="sdp-testimonial-text">{t.text}</p>
                <div className="sdp-testimonial-author">
                  <div className="sdp-testimonial-avatar" style={{ background: t.color }}>
                    {t.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <strong>{t.author}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sdp-dash-cta">
          <h2>{data.ctaTitle}</h2>
          <p>{data.ctaSub}</p>
          <div className="sdp-cta-actions">
            <Link to={data.primaryCTALink} className="sdp-btn-primary">
              {data.ctaPrimary}
            </Link>
            <button className="sdp-btn-outline" onClick={() => setPricingOpen(true)}>
              {data.ctaSecondary}
            </button>
          </div>
        </section>

        {/* ── Pricing Modal ── */}
        {pricingOpen && (
          <div className="sdp-modal-overlay" onClick={() => setPricingOpen(false)}>
            <div className="sdp-modal" onClick={e => e.stopPropagation()}>
              <button className="sdp-modal-close" onClick={() => setPricingOpen(false)}>✕</button>
              <div className="sdp-modal-icon">💰</div>
              <h3 className="sdp-modal-title">Interested in {data.title?.replace('.', '')}?</h3>
              <p className="sdp-modal-sub">
                Get full access to the <strong>{data.title}</strong> module with priority onboarding,
                dedicated support, and flexible pricing tailored to your operation size.
              </p>
              <div className="sdp-modal-benefits">
                <div className="sdp-modal-benefit"><span className="sdp-modal-check">✓</span> Full module access</div>
                <div className="sdp-modal-benefit"><span className="sdp-modal-check">✓</span> Priority onboarding & training</div>
                <div className="sdp-modal-benefit"><span className="sdp-modal-check">✓</span> Dedicated account manager</div>
                <div className="sdp-modal-benefit"><span className="sdp-modal-check">✓</span> Custom pricing per seat</div>
              </div>
              <div className="sdp-modal-actions">
                <button className="sdp-modal-btn-primary" onClick={() => navigate('/login')}>
                  Order Now
                </button>
                <button className="sdp-modal-btn-ghost" onClick={() => setPricingOpen(false)}>
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ServiceDashboardLayout>
  );
};

export default ServiceDetailPage;
