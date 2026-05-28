import React, { useState } from 'react';
import { PublicNav, PublicFooter } from './ServicesPage';
import './PublicLayout.css';
import ToggleSection from './ToggleSection';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [sent, setSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API request
    setSent(true);
  };

  const contactInfo = [
    { 
      icon: '📍', 
      label: 'Main Headquarters', 
      value: 'Injibara, Ethiopia',
      sub: 'Located inside Injibara University, central business complex.'
    },
    { 
      icon: '📞', 
      label: 'Direct Consultation Line', 
      value: '+251 91 123 4567',
      sub: 'Available for general inquiries, live product demonstrations, and technical support.'
    },
    { 
      icon: '✉️', 
      label: 'Email Communications', 
      value: 'hello@sutana.et',
      sub: 'Send us your RFP documents, custom integration requirements, or feedback.'
    },
    { 
      icon: '🕐', 
      label: 'Operational Working Hours', 
      value: 'Mon – Fri, 8:00 AM – 6:00 PM',
      sub: 'Ethiopian Local Time (excluding public holidays). Emergency support available 24/7.'
    },
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
      
      {/* ── Hero ── */}
      <section className="pub-hero pub-hero--slim">
        <div className="pub-hero-inner">
          <span className="pub-badge">Contact Us</span>
          <h1>Let's Start a Conversation</h1>
          <p>
            Have a question about our enterprise modules, need a customized demo for your team, 
            or ready to migrate your legacy spreadsheets to SUTANA? Our product specialists are 
            standing by to help you transform your business operations.
          </p>
        </div>
      </section>

      {/* ── Main Contact & Form Section ── */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="contact-grid">
            {/* Contact Details */}
            <div className="contact-info">
              <h3>Reach Us Directly</h3>
              <p className="contact-info-sub">
                Our support team and product specialists aim to respond to all inquiries within 24 business hours. 
                Feel free to visit our office or reach out through any of our channels below.
              </p>
              <div className="contact-info-cards">
                {contactInfo.map((c, i) => (
                  <div className="contact-info-card" key={i}>
                    <span className="contact-info-icon">{c.icon}</span>
                    <div>
                      <strong>{c.label}</strong>
                      <p className="contact-info-val">{c.value}</p>
                      <span className="contact-info-subtext">{c.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-card">
              {sent ? (
                <div className="contact-sent">
                  <span className="contact-sent-icon">✅</span>
                  <h3>Thank You for Reaching Out!</h3>
                  <p>
                    Your message has been successfully received, {form.name}. One of our business consultants 
                    will review your inquiry and follow up at <strong>{form.email}</strong> to discuss how 
                    we can support your company's growth.
                  </p>
                  <button className="pub-btn-primary" onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', message: '' }); }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <h3>Send Us a Secure Message</h3>
                  <p style={{ fontSize: '14px', color: 'var(--pub-text-2)', marginBottom: '24px', lineHeight: '1.6' }}>
                    Fill out the form below, and we will route your inquiry to the correct department (Sales, Technical Support, or Integrations).
                  </p>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="contact-name">Full Name <span>*</span></label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        placeholder="e.g. Betelhem Gete"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="contact-email">Email Address <span>*</span></label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        placeholder="e.g. betelehem@company.et"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="contact-company">Company Name</label>
                    <input
                      id="contact-company"
                      type="text"
                      name="company"
                      placeholder="e.g. Betelhem Trading PLC"
                      value={form.company}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="contact-message">How can SUTANA help your business? <span>*</span></label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder="Please specify your business type, approximate number of users, and which modules you are interested in (POS, Inventory, Finance, Printing workflow)..."
                      value={form.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="pub-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Submit Inquiry & Request Demo →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="pub-section pub-section--alt">
        <div className="pub-container" style={{ maxWidth: '800px' }}>
          <ToggleSection
            label="Common Inquiries"
            title="Frequently Asked Questions"
            titleAccent=""
          >
            <p className="cnx-toggle-desc">
              Got questions before you take the leap? We have gathered answers to the most frequent 
              questions we hear from business owners, IT managers, and finance directors.
            </p>

            <div className="contact-faq-list">
              {faqs.map((faq, idx) => (
                <div 
                  className={`contact-faq-item ${activeFaq === idx ? 'active' : ''}`} 
                  key={idx}
                  onClick={() => toggleFaq(idx)}
                >
                  <div className="contact-faq-question">
                    <h4>{faq.q}</h4>
                    <span className="contact-faq-toggle-icon">{activeFaq === idx ? '−' : '+'}</span>
                  </div>
                  <div className="contact-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </ToggleSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default ContactPage;
