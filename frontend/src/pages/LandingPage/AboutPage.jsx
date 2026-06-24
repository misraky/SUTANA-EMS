import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from './ServicesPage';
import './PublicLayout.css';
import './AboutPage.css';

const TEAM = [
  {
    name: 'Yonas Mezgebu',
    role: 'Chief Executive Officer',
    img: '/team_yonas.png',
  },
  {
    name: 'Selamawit Tadesse',
    role: 'Chief Operations Officer',
    img: '/team_selamawit.png',
  },
  {
    name: 'Elias Gebre',
    role: 'Chief Technology Officer',
    img: '/team_elias.png',
  },
  {
    name: 'Martha Haile',
    role: 'Head of Product Strategy',
    img: '/team_martha.png',
  },
];

const MODULES = [
  {
    icon: '🌾',
    title: 'Farming',
    desc: 'Precision management for industrial agriculture, optimizing yields and supply chain logistics.',
  },
  {
    icon: '🏦',
    title: 'Finance',
    desc: 'Robust accounting frameworks aligned with local tax laws and international standards.',
  },
  {
    icon: '🏪',
    title: 'Retail',
    desc: 'Seamless inventory and point-of-sale systems built for high-growth commercial enterprises.',
  },
];

const STATS = [
  { value: '500+', label: 'Enterprises Served' },
  { value: '10+',  label: 'Industries Covered' },
  { value: '99.9%', label: 'Data Accuracy' },
  { value: '24/7', label: 'Local Support' },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-copy">
            <span className="about-established-badge">Established 2014</span>
            <h1 className="about-hero-title">
              Building the Future of<br />Ethiopian Enterprise
            </h1>
            <p className="about-hero-sub">
              Empowering Ethiopian enterprises through high-performance technology. We bridge the gap between traditional business operations and modern digital efficiency.
            </p>
            <div className="about-hero-actions">
              <Link to="/contact" className="about-btn-primary">Partner with Us</Link>
              <Link to="/contact" className="about-btn-outline">View Case Studies</Link>
            </div>
          </div>
          <div className="about-hero-visual">
            <img src="/about_office.png" alt="Sutana Enterprise Office" className="about-hero-img" />
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="about-mission">
        <div className="about-mission-inner">
          <h2 className="about-mission-title">A Mission for Localization</h2>
          <div className="about-mission-divider"></div>
          <p className="about-mission-text">
            Founded with a vision to revolutionize the digital landscape of East Africa, Sutana ERP specializes in crafting
            solutions that are deeply rooted in local market dynamics. From the vast commercial farms of the Rift Valley
            to the bustling retail hubs of Addis Ababa, we design technology that understands the unique rhythms of
            Ethiopian enterprise.
          </p>

          <div className="about-modules-grid">
            {MODULES.map((m, i) => (
              <div key={i} className="about-module-card">
                <div className="about-module-icon">{m.icon}</div>
                <h3 className="about-module-title">{m.title}</h3>
                <p className="about-module-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="about-values-section">
        <div className="about-values-inner">
          <h2 className="about-values-heading">Core Values</h2>
          <p className="about-values-sub">The pillars of our institutional excellence.</p>

          <div className="about-bento-grid">
            {/* Top row */}
            <div className="about-bento-card about-bento-icon-only">
              <div className="about-bento-check">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
            </div>
            <div className="about-bento-card about-bento-blue">
              <div className="about-bento-value-icon">💡</div>
              <h3>Innovation</h3>
              <p>Constantly evolving our tech stack to integrate AI-driven predictive analytics for the local market.</p>
            </div>

            {/* Bottom row */}
            <div className="about-bento-card about-bento-integrity">
              <h3>Integrity</h3>
              <p>Uncompromising commitment to transparency and ethical data management. We believe trust is the ultimate enterprise currency.</p>
            </div>
            <div className="about-bento-card about-bento-small">
              <div className="about-bento-value-icon">📍</div>
              <h4>Localization</h4>
              <p>Technology tailored for the unique challenges of the African enterprise ecosystem.</p>
            </div>
            <div className="about-bento-card about-bento-small">
              <div className="about-bento-value-icon">🎯</div>
              <h4>Precision</h4>
              <p>A obsession with 99.9% data accuracy across all modules.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="about-stats-bar">
        {STATS.map((s, i) => (
          <div key={i} className="about-stat-item">
            <span className="about-stat-value">{s.value}</span>
            <span className="about-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Team ── */}
      <section className="about-team-section">
        <div className="about-team-inner">
          <h2 className="about-team-title">The Minds Behind Sutana</h2>
          <p className="about-team-sub">
            Our leadership brings decades of combined experience in global software engineering
            and local business strategy.
          </p>

          <div className="about-team-grid">
            {TEAM.map((member, i) => (
              <div key={i} className="about-team-card">
                <div className="about-team-photo-wrap">
                  <img src={member.img} alt={member.name} className="about-team-photo" />
                </div>
                <div className="about-team-info">
                  <h4 className="about-team-name">{member.name}</h4>
                  <span className="about-team-role">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default AboutPage;
