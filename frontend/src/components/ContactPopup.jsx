import React, { useState, useRef, useEffect } from 'react';
import axios from '../services/apiClient';
import { X, Send, Paperclip, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

const DEPARTMENTS = ['General Inquiry', 'Sales', 'Support', 'Complaint', 'Partnership'];

const rippleKeyframes = `
@keyframes contact-ripple {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.8); opacity: 0; }
}
`;

export default function ContactPopup() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '', department: 'General Inquiry', message: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const backdropRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };

  const validate = () => {
    const e = {};
    if (!form.full_name || form.full_name.length < 2 || form.full_name.length > 100) e.full_name = '2–100 characters required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.phone && !/^[\d\s+\-]{7,15}$/.test(form.phone)) e.phone = 'Invalid phone format';
    if (!form.subject || form.subject.length < 5 || form.subject.length > 200) e.subject = '5–200 characters required';
    if (!form.message || form.message.length < 10 || form.message.length > 2000) e.message = '10–2000 characters required';
    if (file && file.size > 5 * 1024 * 1024) e.file = 'File must be under 5MB';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('attachment', file);
      const res = await axios.post('/contact', fd);
      if (res.status === 'success') setSubmitted(true);
    } catch (err) {
      setServerError(err.message || 'Failed to send. Please try again.');
    } finally { setSubmitting(false); }
  };

  const isFormValid = form.full_name && form.email && form.subject && form.message
    && form.full_name.length >= 2 && form.subject.length >= 5 && form.message.length >= 10
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  return (
    <>
      <style>{rippleKeyframes}</style>

      <div style={{
        position: 'fixed', bottom: 80, right: 20, zIndex: open ? -1 : 9999,
        width: 56, height: 56,
        opacity: open ? 0 : 1,
        transition: 'opacity 0.2s ease',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid #059669',
          animation: 'contact-ripple 2s ease-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid #059669',
          animation: 'contact-ripple 2s ease-out infinite',
          animationDelay: '0.6s',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid #059669',
          animation: 'contact-ripple 2s ease-out infinite',
          animationDelay: '1.2s',
        }} />
        <button onClick={() => setOpen(o => !o)} onKeyDown={handleEsc} aria-label="Contact us"
          style={{
            position: 'relative', width: '100%', height: '100%', borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #1E3A5F, #10B981)',
            boxShadow: open ? '0 6px 25px rgba(0,0,0,0.35)' : '0 4px 15px rgba(0,0,0,0.2)',
            transform: open ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s ease-in-out',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.35)'; }}
          onMouseLeave={e => { if (!open) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; } }}
        >
          <MessageSquare size={24} color="white" />
        </button>
      </div>

      {open && (
          <div ref={backdropRef} onClick={e => { if (e.target === backdropRef.current) setOpen(false); }}
            onKeyDown={handleEsc} tabIndex={-1}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px',
            }}>
          <div role="dialog" aria-modal="true" aria-label="Contact form"
            style={{
              background: 'white', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
              padding: 32, position: 'relative',
            }}>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{
              position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4,
            }}><X size={20} /></button>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <CheckCircle size={48} color="#10B981" style={{ marginBottom: 16 }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1E3A5F' }}>Message Sent Successfully</h3>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b' }}>We will get back to you within 24 hours.</p>
                <button onClick={() => { setOpen(false); setSubmitted(false); setForm({ full_name: '', email: '', phone: '', subject: '', department: 'General Inquiry', message: '' }); setFile(null); }}
                  style={{ padding: '10px 32px', background: '#1E3A5F', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  OK
                </button>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <a href="/" onClick={e => { e.preventDefault(); setOpen(false); }}
                    style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1E3A5F'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >
                    ← Go Back
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#1E3A5F' }}>Contact Us</h2>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>Send us a message and we'll respond within 24 hours.</p>

                {serverError && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: '#fee2e2', color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} /> {serverError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name *</label>
                    <input ref={firstInputRef} name="full_name" value={form.full_name} onChange={handleChange} aria-label="Full Name"
                      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.full_name ? '#ef4444' : '#d1d5db'}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    {errors.full_name && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.full_name}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} aria-label="Email"
                      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    {errors.email && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.email}</p>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} aria-label="Phone"
                      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.phone ? '#ef4444' : '#d1d5db'}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    {errors.phone && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Department *</label>
                    <select name="department" value={form.department} onChange={handleChange} aria-label="Department"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white' }}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Subject *</label>
                  <input name="subject" value={form.subject} onChange={handleChange} aria-label="Subject"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.subject ? '#ef4444' : '#d1d5db'}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  {errors.subject && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.subject}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={4} aria-label="Message"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.message ? '#ef4444' : '#d1d5db'}`, borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                  {errors.message && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.message}</p>}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    <Paperclip size={14} style={{ display: 'inline', marginRight: 4 }} /> Attachment <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — PDF, DOC, JPG, PNG, max 5MB)</span>
                  </label>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} aria-label="Attachment"
                    style={{ fontSize: 13 }} />
                  {errors.file && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.file}</p>}
                </div>

                <button type="submit" disabled={!isFormValid || submitting} style={{
                  width: '100%', padding: '10px 0', background: submitting ? '#94a3b8' : '#1E3A5F', color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 600, fontSize: 14, cursor: submitting || !isFormValid ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {submitting ? 'Sending...' : <><Send size={16} /> Send Message</>}
                </button>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <a href="/" onClick={e => { e.preventDefault(); setOpen(false); }}
                    style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1E3A5F'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >
                    ← Go Back
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
