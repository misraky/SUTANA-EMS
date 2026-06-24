import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return visible ? (
    <div className="tip-wrap" style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999 }}>
      <span className="tip tip-up">Back to top</span>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        style={{
          width: 48, height: 48, borderRadius: '50%',
          background: '#059669', color: 'white', border: 'none',
          boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
      >
        <ArrowUp size={22} />
      </button>
    </div>
  ) : null;
};
