import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from './ServicesPage';
import './PublicLayout.css';
import './ContactPage.css';
import ToggleSection from './ToggleSection';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const contactInfo = [
    {
      icon: '📍',
      label: 'Main Headquarters',
      value: 'Injibara, Ethiopia',
      sub: 'Injibara University, central business complex.',
    },
    {
      icon: '📞',
      label: 'Direct Consultation Line',
      value: '+251 91 123 4567',
      sub: 'General inquiries, demos, and technical support.',
    },
    {
      icon: '✉️',
      label: 'Email Communications',
      value: 'hello@sutana.et',
      sub: 'RFP documents, integration requests, or feedback.',
    },
    {
      icon: '🕐',
      label: 'Operational Working Hours',
      value: 'Mon – Fri, 8:00 AM – 6:00 PM',
      sub: 'Ethiopian Local Time. Emergency support 24/7.',
    },
  ];

  const quickStats = [
    { num: '500+', label: 'Enterprises Onboarded' },
    { num: '98%', label: 'Client Satisfaction' },
    { num: '3–7', label: 'Days to Go Live' },
    { num: '24/7', label: 'Support Coverage' },
  ];

  const faqs = [
    {
      q: "How long does the implementation and onboarding process take?",
      a: "For most small to medium businesses in Ethiopia, full implementation takes between 3 to 7 business days. This comprehensive process includes setting up your isolated secure database, importing existing inventory, supplier, and customer lists, and conducting interactive hands-on training sessions for your cashiers, store managers, and accounting staff."
    },
    {
      q: "Is SUTANA compliant with Ethiopian tax regulations and ERCA rules?",
      a: "Yes, completely. SUTANA is built from the ground up to respect Ethiopian tax laws. The system automates VAT calculations (15%), manages withholding taxes, tracks tax-exempt items, and generates standard, audit-ready financial statements and receipts that align perfectly with the guidelines of the Ministry of Revenue and ERCA."
    },
    {
      q: "Can we request custom features specific to our business workflow?",
      a: "Yes, we offer custom development and integration services for our enterprise clients. Whether you run a specialized manufacturing assembly, a high-volume printing press with custom quoting formulas, or a multi-branch retail distribution network, our engineering team can build custom APIs, unique reporting templates, and specialized modules tailored to your specific workflows."
    },
    {
      q: "How secure is our business financial and inventory data?",
      a: "We implement bank-grade security protocols across our entire ecosystem. All communication is encrypted using secure SSL protocols, and data is stored in modern database clusters with daily automated, off-site encrypted backups. Furthermore, our granular role-based access system ensures that store clerks, cashiers, accountants, and executives only see the specific screens and information required for their duties."
    },
    {
      q: "Do you offer offline capabilities if our internet connection is unstable?",
      a: "Yes. We understand that internet reliability varies across different regions. SUTANA features localized caching optimization for core operations like point-of-sale receipting. Your cashiers can continue registering sales during temporary internet drops, and the system will silently upload and sync all transactions once the connection is restored."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="public-page">
      <PublicNav />

      {/* ═══════════ HERO ═══════════ */}
      <section className="cp-hero">
        <div className="cp-hero-bg" />
        <div className="cp-hero-inner">
          <div className="cp-hero-copy">
            <span className="cp-pill">Get in Touch</span>
            <h1 className="cp-hero-title">
              Let's build something<br />
              <span className="cp-hero-accent">great together</span>
            </h1>
            <p className="cp-hero-sub">
              Whether you are evaluating SUTANA for your enterprise, need a custom integration,
              or just want to say hello — our team is ready to help.
            </p>
            <div className="cp-hero-actions">
              <a href="#contact-form" className="cp-btn-primary">
                Send a Message
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="#faq" className="cp-btn-ghost">
                View FAQs
              </a>
            </div>
          </div>
          <div className="cp-hero-visual">
            <div className="cp-hero-card">
              <div className="cp-hero-card-header">
                <div className="cp-hero-card-dots">
                  <span style={{background:'#EF4444'}} /><span style={{background:'#F59E0B'}} /><span style={{background:'#10B981'}} />
                </div>
                <span className="cp-hero-card-title">New Inquiry</span>
              </div>
              <div className="cp-hero-card-body">
                <div className="cp-hero-card-row"><span>From</span><span>Betelhem Gete</span></div>
                <div className="cp-hero-card-row"><span>Company</span><span>Betelhem Trading PLC</span></div>
                <div className="cp-hero-card-row"><span>Module</span><span>Inventory + Finance</span></div>
                <div className="cp-hero-card-progress">
                  <div className="cp-hero-card-bar" />
                </div>
                <span className="cp-hero-card-status">✓ Routed to Sales Team</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ QUICK STATS ═══════════ */}
      <section className="cp-stats">
        {quickStats.map((s, i) => (
          <div key={i} className="cp-stat-item">
            <span className="cp-stat-num">{s.num}</span>
            <span className="cp-stat-lbl">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ═══════════ CONTACT INFO + FORM ═══════════ */}
      <section className="cp-section">
        <div className="cp-container">
          <div className="cp-grid">
            {/* Left — Contact cards */}
            <div className="cp-info">
              <h2 className="cp-section-title">Contact Information</h2>
              <p className="cp-section-sub">
                Our support team and product specialists aim to respond to all inquiries within 24 business hours.
              </p>
              <div className="cp-info-cards">
                {contactInfo.map((c, i) => (
                  <div key={i} className="cp-info-card">
                    <div className="cp-info-icon-wrap">{c.icon}</div>
                    <div>
                      <strong className="cp-info-label">{c.label}</strong>
                      <p className="cp-info-value">{c.value}</p>
                      <p className="cp-info-sub">{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="cp-form-wrap" id="contact-form">
              {sent ? (
                <div className="cp-sent">
                  <div className="cp-sent-icon">✓</div>
                  <h3>Message Sent Successfully!</h3>
                  <p>
                    Thank you, <strong>{form.name}</strong>. A business consultant will follow up at{' '}
                    <strong>{form.email}</strong> within 24 hours.
                  </p>
                  <button className="cp-btn-primary" onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', phone: '', message: '' }); }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="cp-form" onSubmit={handleSubmit}>
                  <h3>Send us a message</h3>
                  <p className="cp-form-sub">Fill out the form below and we will route your inquiry to the right department.</p>
                  <div className="cp-form-row">
                    <div className="cp-field">
                      <label>Full Name <span>*</span></label>
                      <input type="text" name="name" placeholder="Betelhem Gete" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="cp-field">
                      <label>Email Address <span>*</span></label>
                      <input type="email" name="email" placeholder="betelhem@company.et" value={form.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="cp-form-row">
                    <div className="cp-field">
                      <label>Company Name</label>
                      <input type="text" name="company" placeholder="Betelhem Trading PLC" value={form.company} onChange={handleChange} />
                    </div>
                    <div className="cp-field">
                      <label>Phone Number</label>
                      <input type="tel" name="phone" placeholder="+251 91 234 5678" value={form.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="cp-field">
                    <label>How can we help? <span>*</span></label>
                    <textarea name="message" rows={4} placeholder="Tell us about your business, number of users, and which modules interest you..." value={form.message} onChange={handleChange} required />
                  </div>
                  <button type="submit" className="cp-btn-primary cp-btn-block">
                    Submit Inquiry
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MAP PLACEHOLDER ═══════════ */}
      <section className="cp-map-section">
        <div className="cp-container">
          <div className="cp-map-card">
            <div className="cp-map-content">
              <div className="cp-map-marker">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3>Visit Our Headquarters</h3>
              <p>Injibara, Ethiopia — Inside Injibara University, central business complex.</p>
              <div className="cp-map-grid">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`cp-map-cell ${Math.random() > 0.6 ? 'cp-map-cell--active' : ''}`} style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="cp-faq-section" id="faq">
        <div className="cp-container">
          <div className="cp-faq-header">
            <span className="cp-faq-label">Common Inquiries</span>
            <h2>Frequently Asked Questions</h2>
            <p>Answers to the most common questions from business owners, IT managers, and finance directors.</p>
          </div>
          <div className="cp-faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`cp-faq-item ${activeFaq === idx ? 'cp-faq-item--open' : ''}`} onClick={() => toggleFaq(idx)}>
                <div className="cp-faq-q">
                  <h4>{faq.q}</h4>
                  <span className="cp-faq-icon">{activeFaq === idx ? '−' : '+'}</span>
                </div>
                <div className="cp-faq-a">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="cp-cta">
        <div className="cp-cta-bg" />
        <div className="cp-container cp-cta-inner">
          <h2>Ready to transform your operations?</h2>
          <p>Join 500+ Ethiopian enterprises running on SUTANA. Get started today.</p>
          <div className="cp-cta-actions">
            <Link to="/auth/register" className="cp-btn-primary cp-btn-primary--light">Start Free Trial</Link>
            <Link to="/services" className="cp-btn-ghost cp-btn-ghost--light">Explore Services</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default ContactPage;