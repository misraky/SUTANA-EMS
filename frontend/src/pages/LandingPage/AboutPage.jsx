import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav, PublicFooter } from './ServicesPage';
import './PublicLayout.css';
import ToggleSection from './ToggleSection';

const AboutPage = () => {
  const navigate = useNavigate();
  const timeline = [
    {
      year: '2020',
      title: 'Foundation',
      desc: 'SUTANA was born from a simple but powerful observation: Ethiopian businesses were wasting countless hours managing operations across disconnected spreadsheets, handwritten ledgers, and fragmented software tools. We set out to build the unified platform that the market desperately needed — one that understood the local context from day one.',
    },
    {
      year: '2022',
      title: 'Core Modules Launched',
      desc: 'Finance, Sales, Inventory, and Printing modules go live with real-time data synchronization. Early adopters saw immediate results — month-end close times cut by 70%, stock discrepancies eliminated, and for the first time, leadership could see their entire business in one dashboard instead of five.',
    },
    {
      year: '2026',
      title: 'Multi-Department Intelligence',
      desc: 'Cross-department analytics, CEO dashboards, procurement lifecycle management, and a customer self-service portal roll out enterprise-wide. SUTANA evolves from a management tool into a full business intelligence platform, connecting every department with live, actionable data.',
    },
    {
      year: '2027 ➜',
      title: 'AI-Powered Insights',
      desc: 'Machine-learning forecasting, automated procurement suggestions, smart inventory optimization, and predictive financial alerts are on the roadmap. SUTANA will begin anticipating your needs — warning you of risks before they happen and suggesting actions before you have to ask.',
    },
    {
      year: '2028 ➜',
      title: 'Pan-African Expansion',
      desc: 'Multi-currency, multi-language support for East African markets, cloud-native deployment for businesses of all sizes, and an open API ecosystem for third-party integrations. SUTANA\'s vision extends far beyond Ethiopia — we are building the ERP platform for the entire African century.',
    },
  ];
  const values = [
    {
      icon: '🔒',
      title: 'Security First',
      desc: 'Bank-grade encryption, granular role-based access control, and immutable audit trails on every action taken within the system. We treat your business data with the same level of protection you would expect from a financial institution — because your data is your most valuable asset.',
    },
    {
      icon: '⚡',
      title: 'Speed & Reliability',
      desc: 'Sub-100ms API responses backed by a robust MySQL and Node.js infrastructure with 99.9% uptime SLA. We have engineered SUTANA to perform at peak load — whether you are running a single-store operation or a multi-branch enterprise processing thousands of transactions per day.',
    },
    {
      icon: '🌍',
      title: 'Local Expertise',
      desc: 'Built specifically for Ethiopian tax regulations, ETB currency, local business workflows, and the realities of operating in a fast-growing African economy. Our team has deep roots in Ethiopian business culture — we are not translating a foreign product, we are building from lived experience.',
    },
    {
      icon: '🤝',
      title: 'Long-Term Partnership',
      desc: 'We are not just a software vendor. We are a long-term partner committed to your success. Every subscription includes dedicated onboarding support, training for your team, ongoing technical assistance, and a direct line to our product team to share feedback that shapes future features.',
    },
  ];
  const dnaItems = [
    { icon: '🎯', title: 'Customer Obsession', desc: 'Every feature we build starts with a real problem faced by a real Ethiopian business. We listen more than we talk.' },
    { icon: '🧠', title: 'Continuous Learning', desc: 'Our team studies global best practices in ERP, UX, and data engineering — then applies those insights to the Ethiopian context.' },
    { icon: '🌱', title: 'Sustainable Growth', desc: 'We build for the long run. No shortcuts, no technical debt. Every line of code is written to serve you for years, not months.' },
    { icon: '💡', title: 'Bold Innovation', desc: 'We are not afraid to challenge the status quo. From AI forecasting to pan-African expansion, we dream big and execute carefully.' },
    { icon: '🏆', title: 'Excellence in Craft', desc: 'From pixel-perfect UI to rock-solid backend infrastructure, we take pride in every detail of what we build and ship.' },
    { icon: '❤️', title: 'Community Impact', desc: 'By empowering Ethiopian businesses to operate more efficiently, we contribute to jobs, economic growth, and prosperity for all.' },
  ];

  return (
    <div className="public-page">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="pub-hero pub-hero--slim">
        <div className="pub-hero-inner">
          <span className="pub-badge">About & Future</span>
          <h1>Building the Future of Ethiopian Enterprise</h1>
          <p>
            We are on a mission to give every growing Ethiopian business the technology tools that were
            previously only available to large corporations. We believe that great software should be
            accessible, locally understood, and built to last — and that is exactly what SUTANA is.
          </p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="pub-section">
        <div className="pub-container">
          <ToggleSection
            label="Our Mission"
            title="Simplifying Operations,"
            titleAccent="Empowering Growth"
          >
            <div className="about-mission-grid" style={{ paddingTop: '16px' }}>
              <div className="about-mission-text">
                <p>
                  SUTANA was built from the ground up for the realities of Ethiopian business: manual
                  record-keeping, fragmented tools, and the enormous challenge of scaling operations without
                  the right infrastructure. We have seen businesses lose thousands of birr to inventory
                  discrepancies, miss tax deadlines due to poor record management, and lose customers to
                  competitors who simply operated more efficiently.
                </p>
                <p style={{ marginTop: '16px' }}>
                  Our platform unifies printing production, financial accounting, sales, procurement, and
                  inventory into a single, intuitive system — reducing manual errors by over 80%, saving
                  countless hours of administrative work, and giving leadership real-time visibility into every
                  corner of their business. When your data is unified, your decisions become faster, smarter,
                  and more confident.
                </p>
                <p style={{ marginTop: '16px' }}>
                  We measure our success by the success of our clients. When a finance director tells us she
                  now closes the month in hours instead of days, or when a CEO says he finally feels in
                  control of his business — that is why we built SUTANA.
                </p>
                <button className="pub-btn-primary" style={{ marginTop: '28px' }} onClick={() => navigate('/contact')}>
                  Talk to Us →
                </button>
              </div>
              <div className="features-list-pub">
                {values.map((v, i) => (
                  <div className="feature-item-pub" key={i} style={{ padding: i === 0 ? '0 0 48px' : '48px 0' }}>
                    <span className="feature-item-icon">{v.icon}</span>
                    <div className="feature-item-content">
                      <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{v.title}</h4>
                      <p style={{ fontSize: '15px', lineHeight: '1.7' }}>{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section className="pub-section pub-section--alt">
        <div className="pub-container">
          <ToggleSection
            label="Roadmap"
            title="Where We Are"
            titleAccent="Headed"
          >
            <p className="cnx-toggle-desc">
              From our founding vision to a pan-African enterprise platform — here is the clear path we are walking,
              milestone by milestone. We share this roadmap openly because we believe our clients deserve to know
              exactly where their investment is going and what the future holds.
            </p>
            <div className="timeline">
              {timeline.map((t, i) => (
                <div className="timeline-item" key={i}>
                  <div className="timeline-year">{t.year}</div>
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>{t.title}</h4>
                    <p>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── Our DNA ── */}
      <section className="pub-section">
        <div className="pub-container">
          <ToggleSection
            label="Our DNA"
            title="The principles that guide"
            titleAccent="everything we do"
          >
            <p className="cnx-toggle-desc">
              Behind every feature, every design decision, and every line of code are the core principles that
              define who we are as a team and why we show up every day to build SUTANA.
            </p>
            <div className="cnx-why-grid">
              {dnaItems.map((d, i) => (
                <div className="cnx-why-card" key={i}>
                  <div className="cnx-why-icon">{d.icon}</div>
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pub-cta">
        <div className="pub-container pub-cta-inner">
          <h2>Join Us on This Journey</h2>
          <p>
            Be part of the story. Whether you are a small business taking your first step towards
            digitization, or a mid-size enterprise ready to unify your operations — SUTANA is built for you,
            and we are ready to grow with you. Sign in today and start transforming your operations.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
            <button className="pub-btn-primary" onClick={() => navigate('/login')}>
              Get Started →
            </button>
            <button className="pub-btn-outline" onClick={() => navigate('/contact')}>
              Talk to Our Team
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
export default AboutPage;
