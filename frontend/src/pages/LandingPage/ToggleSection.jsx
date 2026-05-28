import React, { useState } from 'react';
import './PublicLayout.css';

const ToggleSection = ({ label, title, titleAccent, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`cnx-toggle-section ${open ? 'cnx-toggle-open' : ''}`}>
      <button className="cnx-toggle-bar" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="cnx-toggle-bar-text">
          {label && <span className="pub-section-label">{label}</span>}
          <h2>
            {titleAccent
              ? <>{title} <span className="cnx-toggle-accent">{titleAccent}</span></>
              : title}
          </h2>
        </div>
        <span className={`cnx-toggle-chevron ${open ? 'cnx-toggle-chevron--open' : ''}`}>▾</span>
      </button>
      <div className={`cnx-toggle-body ${open ? 'cnx-toggle-body--open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default ToggleSection;
