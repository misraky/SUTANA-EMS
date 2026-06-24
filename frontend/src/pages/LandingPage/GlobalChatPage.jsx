import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from './ServicesPage';
import {
  MessageSquare, Mail, Phone, MapPin, ExternalLink,
  Send, X, ArrowLeft
} from 'lucide-react';

const NAVY  = '#1a2b4b';
const TEAL  = '#0D7C66';

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB',
  borderRadius: 10, fontSize: 14, outline: 'none',
  background: '#F9FAFB', transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

export default function GlobalChatPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 32px',
        borderBottom: '1px solid #E5E7EB',
        background: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: '#F3F4F6', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B7280', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; e.currentTarget.style.color = NAVY; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#6B7280'; }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1a2b4b, #0D7C66)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <MessageSquare size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: NAVY }}>Global Chat</span>
        </div>
        <button onClick={() => navigate('/')} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: '#F3F4F6', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6B7280', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#6B7280'; }}>
          <X size={18} />
        </button>
      </div>

      {/* Split Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── LEFT: Info + Map ── */}
        <div style={{
          flex: '0 0 45%', overflowY: 'auto',
          background: 'linear-gradient(160deg, #F0FDF4 0%, #EEF2FF 100%)',
          padding: '40px 36px',
        }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#fff', padding: '6px 16px', borderRadius: 99,
              border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700, color: TEAL,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 14,
            }}>
              <MessageSquare size={12} /> Let's Talk
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: '0 0 8px', lineHeight: 1.2 }}>
              We're Here to <span style={{ color: TEAL }}>Help</span>
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6B7280', margin: 0 }}>
              Reach out through any channel below. Our team typically responds within 24 hours.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#fff', borderRadius: 14, padding: '16px 18px',
              border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: '#D1FAE5', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#059669', flexShrink: 0,
              }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 2 }}>Email</div>
                <a href="mailto:info@sutana.com" style={{ fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>info@sutana.com</a>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#fff', borderRadius: 14, padding: '16px 18px',
              border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: '#DBEAFE', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#2563EB', flexShrink: 0,
              }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 2 }}>Phone</div>
                <a href="tel:+251911234567" style={{ fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>+251 911 234 567</a>
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 14, overflow: 'hidden',
            border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderBottom: '1px solid #E5E7EB',
            }}>
              <MapPin size={16} color={TEAL} />
              <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
                Injibara University, Awi Zone, Amhara Region
              </span>
            </div>
            <div style={{ height: 220 }}>
              <iframe
                title="Injibara University Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.5!2d36.9300!3d10.9547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU3JzE2LjkiTiAzNsKwNTUnNDguMCJF!5e0!3m2!1sen!2set!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button onClick={() => window.open('https://wa.me/251911234567', '_blank')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', border: 'none', borderRadius: 12,
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,211,102,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.3)'; }}>
              <MessageSquare size={18} />
              WhatsApp Chat
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Contact Form ── */}
        <div style={{
          flex: '0 0 55%', overflowY: 'auto',
          background: '#fff',
          padding: '40px 44px',
          display: 'flex', flexDirection: 'column',
        }}>
          {submitted ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#D1FAE5', display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 20,
              }}>
                <Send size={32} color="#059669" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 8px' }}>Message Sent!</h3>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', maxWidth: 360 }}>
                Thank you for reaching out. We'll review your message and get back to you within 24 hours.
              </p>
              <button onClick={() => navigate('/')} style={{
                padding: '12px 32px', border: 'none', borderRadius: 10,
                background: NAVY, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Back to Home</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: '0 0 4px' }}>Send a Message</h3>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Fill out the form and we'll get back to you.</p>
              </div>

              <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Full Name *</label>
                    <input required style={inputStyle} placeholder="Your name" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email *</label>
                    <input type="email" required style={inputStyle} placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Subject</label>
                  <input style={inputStyle} placeholder="How can we help?" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Message *</label>
                  <textarea required rows={5} style={{ ...inputStyle, flex: 1, minHeight: 120, resize: 'vertical' }} placeholder="Tell us more about your inquiry..." />
                </div>
                <button type="submit" style={{
                  padding: '14px 0', border: 'none', borderRadius: 12,
                  background: 'linear-gradient(135deg, #1a2b4b, #0D7C66)',
                  color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <Send size={16} /> Send Message
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}