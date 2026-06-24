import React, { useState, useEffect } from 'react';
import { PublicNav } from './PublicNavFooter';

const launchDate = new Date();
launchDate.setDate(launchDate.getDate() + 30);

const RegularMarketPage = () => {
  const [time, setTime] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const dist = launchDate - now;
      if (dist < 0) { setTime({ days: '00', hours: '00', minutes: '00', seconds: '00' }); return; }
      setTime({
        days: Math.floor(dist / 86400000).toString().padStart(2, '0'),
        hours: Math.floor((dist % 86400000) / 3600000).toString().padStart(2, '0'),
        minutes: Math.floor((dist % 3600000) / 60000).toString().padStart(2, '0'),
        seconds: Math.floor((dist % 60000) / 1000).toString().padStart(2, '0'),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <><PublicNav />
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Poppins', sans-serif",
      background: 'linear-gradient(-45deg, #00c6ff, #0072ff, #ee0979, #ff6a00)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 24,
        padding: '3rem 4rem',
        boxShadow: '0 25px 45px rgba(0,0,0,0.2)',
        animation: 'fadeInUp 1.5s ease-out',
        maxWidth: '90%',
        width: 600,
        color: '#fff',
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.5rem', textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>Coming Soon</h1>
        <p style={{ fontSize: '1.2rem', fontWeight: 300, marginBottom: '2.5rem', opacity: 0.9 }}>We're building something amazing. Stay tuned!</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
          {[
            { label: 'Days', value: time.days },
            { label: 'Hours', value: time.hours },
            { label: 'Minutes', value: time.minutes },
            { label: 'Seconds', value: time.seconds },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 16, minWidth: 90, border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 600, lineHeight: 1, marginBottom: '0.5rem' }}>{t.value}</span>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default RegularMarketPage;
