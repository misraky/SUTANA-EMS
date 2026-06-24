import React, { useState, useEffect, useCallback, useRef } from 'react';

import img1 from '../../assets/tender.png';
import img2 from '../../assets/rental.png';
import img3 from '../../assets/printing (2).png';
import img4 from '../../assets/pharmacy.png';
import img5 from '../../assets/farming.png';
import img6 from '../../assets/advice.png';

const images = [img1, img2, img3, img4, img5, img6];

const ChevronLeft = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const s = {
  wrapper: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    background: '#0a0f1a',
  },
  track: {
    display: 'flex',
    transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    height: '100%',
  },
  slide: {
    minWidth: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    userSelect: 'none',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 48,
    height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s, opacity 0.2s',
    opacity: 0,
    borderRadius: 0,
  },
  arrowVisible: {
    opacity: 1,
  },
  arrowLeft: { left: 0 },
  arrowRight: { right: 0 },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    zIndex: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.7)',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    transition: 'background 0.3s, border-color 0.3s',
  },
  dotActive: {
    background: '#fff',
    borderColor: '#fff',
  },
};

const aspectRatio = 16 / 6;

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 5,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.30) 100%)',
  pointerEvents: 'none',
  textAlign: 'center',
  padding: '0 20px',
};

const brandTextStyle = {
  color: '#d4a017',
  fontWeight: 800,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  textShadow: '0 2px 16px rgba(0,0,0,0.6)',
  lineHeight: 1.15,
};

const brandSubStyle = {
  color: '#d4a017',
  fontWeight: 400,
  letterSpacing: '6px',
  textTransform: 'uppercase',
  textShadow: '0 2px 16px rgba(0,0,0,0.6)',
  marginTop: '0.4em',
};

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const [hover, setHover] = useState(false);
  const timerRef = useRef(null);
  const len = images.length;

  const goTo = useCallback((i) => {
    setCurrent((i + len) % len);
  }, [len]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (hover) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [hover, next]);

  return (
    <div
      style={s.wrapper}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ width: '100%', paddingTop: `${100 / aspectRatio}%`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
          <div style={{ ...s.track, transform: `translateX(-${current * 100}%)` }}>
            {images.map((src, i) => (
              <div key={i} style={s.slide}>
                <img src={src} alt={`Slide ${i + 1}`} style={s.img} draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay with brand text */}
      <div style={overlayStyle}>
        <h1 style={{ ...brandTextStyle, fontSize: 'clamp(1.6rem, 5vw, 3.4rem)' }}>
          SUTANA Enterprise
        </h1>
        <p style={{ ...brandSubStyle, fontSize: 'clamp(0.7rem, 2.2vw, 1.3rem)' }}>
          &amp; Consultancy
        </p>
      </div>

      <button
        style={{ ...s.arrow, ...s.arrowLeft, ...(hover ? s.arrowVisible : {}) }}
        onClick={prev}
        aria-label="Previous slide"
      ><ChevronLeft /></button>
      <button
        style={{ ...s.arrow, ...s.arrowRight, ...(hover ? s.arrowVisible : {}) }}
        onClick={next}
        aria-label="Next slide"
      ><ChevronRight /></button>

      <div style={s.dots}>
        {images.map((_, i) => (
          <button
            key={i}
            style={{ ...s.dot, ...(i === current ? s.dotActive : {}) }}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
