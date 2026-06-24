import React, { useState, useEffect, useRef } from 'react';
import './ResponsiveFixes.css';

import event1 from '../../assets/event/event1.png';
import event2 from '../../assets/event/man2.png';
import event3 from '../../assets/event/event3.jpg';
import event4 from '../../assets/event/event4.jpg';
import event5 from '../../assets/event/event5.jpg';

const images = [event1, event2, event3, event4, event5];

export default function EventSection() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % images.length);
        setFade(true);
      }, 600);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <section className="event-section" style={sectionStyle}>
      <div className="event-row" style={containerStyle}>
        {/* Left — Image */}
        <div style={imageWrapStyle}>
          <div style={imageInnerStyle}>
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Event ${i + 1}`}
                style={{
                  ...imgStyle,
                  opacity: i === index ? (fade ? 1 : 0) : 0,
                  transition: 'opacity 0.6s ease',
                  position: 'absolute',
                  inset: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right — Text */}
        <div style={textWrapStyle}>
          <h2 style={headingStyle}>SUTANA ENTERPRISE & CONSULTANCY</h2>
          <p style={subStyle}>Empowering Agriculture Through Innovation</p>
          <p style={descStyle}>
            SUTANA Enterprise is a leading agricultural technology
            and consultancy firm dedicated to transforming farming
            practices across Ethiopia.
          </p>

          <div style={servicesStyle}>
            <span style={serviceTagStyle}>Agricultural ERP Solutions</span>
            <span style={serviceTagStyle}>Farming Consultancy</span>
            <span style={serviceTagStyle}>Supply Chain Management</span>
            <span style={serviceTagStyle}>Training & Capacity Building</span>
          </div>

          <div style={visionStyle}>
            <h3 style={miniHeadStyle}>OUR VISION</h3>
            <p style={miniTextStyle}>
              To be the premier agricultural technology partner in Ethiopia,
              driving sustainable farming through innovation.
            </p>
          </div>

          <div style={missionStyle}>
            <h3 style={miniHeadStyle}>OUR MISSION</h3>
            <p style={miniTextStyle}>
              To empower farmers and agricultural enterprises with cutting-edge
              technology solutions that increase productivity, efficiency, and profitability.
            </p>
          </div>

          <p style={taglineStyle}>
            Together, we grow. <strong>SUTANA</strong> — Cultivating Tomorrow.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Styles ── */

const sectionStyle = {
  padding: '60px 40px',
  background: '#0f1420',
};

const containerStyle = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'flex',
  gap: 48,
  alignItems: 'center',
};

const imageWrapStyle = {
  flex: '0 0 50%',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
};

const imageInnerStyle = {
  position: 'relative',
  width: '100%',
  paddingTop: '75%',
  background: '#1a1f2e',
};

const imgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const textWrapStyle = {
  flex: '0 0 50%',
  color: '#e2e8f0',
};

const headingStyle = {
  fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
  fontWeight: 800,
  color: '#d4a017',
  letterSpacing: '1px',
  marginBottom: 8,
};

const subStyle = {
  fontSize: 'clamp(0.85rem, 1.6vw, 1.15rem)',
  color: '#94a3b8',
  fontWeight: 500,
  marginBottom: 20,
  letterSpacing: '0.5px',
};

const descStyle = {
  fontSize: '0.95rem',
  lineHeight: 1.7,
  color: '#cbd5e1',
  marginBottom: 24,
};

const servicesStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 24,
};

const serviceTagStyle = {
  padding: '6px 14px',
  background: 'rgba(212, 160, 23, 0.12)',
  border: '1px solid rgba(212, 160, 23, 0.25)',
  borderRadius: 20,
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#d4a017',
};

const visionStyle = {
  marginBottom: 16,
};

const missionStyle = {
  marginBottom: 20,
};

const miniHeadStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#d4a017',
  letterSpacing: '3px',
  marginBottom: 4,
};

const miniTextStyle = {
  fontSize: '0.9rem',
  lineHeight: 1.6,
  color: '#94a3b8',
};

const taglineStyle = {
  fontSize: '1rem',
  fontStyle: 'italic',
  color: '#cbd5e1',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  paddingTop: 16,
};
