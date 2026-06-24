import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Search, Phone, Hash, CheckCircle, Circle, AlertTriangle, ArrowLeft, HelpCircle, Package, Printer, Sprout, Car, Pill, ShoppingCart, X, Truck, MapPin, Clock, Calendar, CreditCard } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

const MODULE_ICONS = {
  PRINTING: <Printer size={18} />,
  CAR_RENTAL: <Car size={18} />,
  PHARMACY: <Pill size={18} />,
  FARMING: <Sprout size={18} />,
  RETAIL: <ShoppingCart size={18} />,
};

const MODULE_COLORS = {
  PRINTING: { primary: '#3b82f6', light: '#eff6ff', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
  CAR_RENTAL: { primary: '#8b5cf6', light: '#f5f3ff', gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
  PHARMACY: { primary: '#ec4899', light: '#fdf2f8', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  FARMING: { primary: '#059669', light: '#ecfdf5', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
  RETAIL: { primary: '#d97706', light: '#fffbeb', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
};

export default () => {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!document.getElementById('track-order-keyframes')) {
      const style = document.createElement('style');
      style.id = 'track-order-keyframes';
      style.textContent = `
        @keyframes trackGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes trackFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalContent {
          from { opacity: 0; transform: translateY(60px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes stagePopIn {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(5,150,105,0.2); }
          50% { box-shadow: 0 0 40px rgba(5,150,105,0.4); }
        }
        .track-btn { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .track-btn:hover { transform: translateY(-3px) scale(1.02); }
        .track-btn:active { transform: translateY(0) scale(0.98); }
        .track-input { transition: all 0.25s ease; }
        .track-input:focus { border-color: #059669 !important; box-shadow: 0 0 0 4px rgba(5,150,105,0.15) !important; }
        .stage-dot { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .stage-dot:hover { transform: scale(1.15); }
        .progress-fill { transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .result-modal { animation: modalContent 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .modal-overlay { animation: modalBackdrop 0.3s ease forwards; }
        .shimmer-text {
          background: linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById('track-order-keyframes');
      if (el) el.remove();
    };
  }, []);

  const validate = () => {
    if (!invoice.trim()) { setError('Please enter your invoice number.'); return false; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return false; }
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 9) { setError('Please enter a valid Ethiopian phone number (09XXXXXXXX).'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!validate()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get('/public/track', {
        params: { invoice: invoice.trim().replace(/^#/, ''), phone: phone.trim() },
      });
      if (res.status === 'success') {
        setResult(res.data);
        setTimeout(() => setShowModal(true), 100);
      } else setError(res.message || 'Order not found.');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment before trying again.');
      } else if (err.response?.status === 404) {
        setError(null);
        setResult(null);
        setSearched(false);
        setError(err.response?.data?.message || 'We could not find an order with the provided Invoice Number and Phone Number.');
      } else {
        setError('Our tracking service is temporarily unavailable. Please try again later or contact us at 011-123-4567.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setShowModal(false);
    setTimeout(() => {
      setResult(null);
      setError(null);
      setSearched(false);
    }, 300);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const colors = result ? MODULE_COLORS[result.module] || MODULE_COLORS.PRINTING : MODULE_COLORS.PRINTING;
  const Icon = result ? MODULE_ICONS[result.module] || Package : Package;

  return (
    <><PublicNav />
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 30%, #fefce8 60%, #ecfdf5 100%)',
      backgroundSize: '400% 400%',
      animation: 'trackGradient 12s ease infinite',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative circles */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)',
        top: -100, left: -100, filter: 'blur(80px)', opacity: 0.5, pointerEvents: 'none',
        animation: 'trackFloat 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
        top: '60%', right: -80, filter: 'blur(70px)', opacity: 0.5, pointerEvents: 'none',
        animation: 'trackFloat 6s ease-in-out infinite', animationDelay: '2s',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        top: '30%', left: '40%', filter: 'blur(60px)', opacity: 0.5, pointerEvents: 'none',
        animation: 'trackFloat 6s ease-in-out infinite', animationDelay: '4s',
      }} />

      {/* Full-width marquee */}
      <div style={{ margin: '0 auto 32px', position: 'relative', zIndex: 2 }}>
        <marquee behavior="scroll" direction="left" scrollamount="5" style={{ display: 'block', padding: '18px 0 10px' }}>
          <span style={{
            fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #059669, #10b981, #6366f1, #f59e0b, #059669)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmer 4s linear infinite',
            paddingRight: 60,
          }}>
            <Truck size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            Track Order &nbsp;·&nbsp; Enter your invoice and phone number to see real-time status &nbsp;·&nbsp;
          </span>
        </marquee>
        <style>{`marquee { scrollbar-width: none; -ms-overflow-style: none; } marquee::-webkit-scrollbar { display: none; }`}</style>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 60px', position: 'relative', zIndex: 2 }}>

        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(226,232,240,0.8)', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#059669', fontWeight: 600, fontSize: 13,
          padding: '8px 16px', borderRadius: 99, marginBottom: 20,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}>
          <ArrowLeft size={15} /> Back
        </button>

        {/* Form - always visible when modal is closed */}
        {!showModal && (
          <form onSubmit={handleSubmit} style={{ animation: 'modalContent 0.5s ease' }}>
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              borderRadius: 20, border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
              padding: 32,
            }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  <Hash size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Invoice Number
                </label>
                <input
                  type="text" value={invoice} onChange={e => setInvoice(e.target.value)}
                  placeholder="INV-20260612-0001"
                  className="track-input"
                  style={{
                    width: '100%', padding: '14px 16px', fontSize: 14,
                    border: '1.5px solid #e2e8f0', borderRadius: 12, boxSizing: 'border-box',
                    outline: 'none', background: 'rgba(255,255,255,0.9)', fontFamily: 'inherit',
                    borderColor: focused === 'invoice' ? '#059669' : '#e2e8f0',
                    boxShadow: focused === 'invoice' ? '0 0 0 4px rgba(5,150,105,0.08)' : 'none',
                  }}
                  onFocus={() => setFocused('invoice')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Phone Number
                </label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  className="track-input"
                  style={{
                    width: '100%', padding: '14px 16px', fontSize: 14,
                    border: '1.5px solid #e2e8f0', borderRadius: 12, boxSizing: 'border-box',
                    outline: 'none', background: 'rgba(255,255,255,0.9)', fontFamily: 'inherit',
                    borderColor: focused === 'phone' ? '#059669' : '#e2e8f0',
                    boxShadow: focused === 'phone' ? '0 0 0 4px rgba(5,150,105,0.08)' : 'none',
                  }}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <button type="submit" className="track-btn" style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(5,150,105,0.25)', letterSpacing: '0.03em',
              }}>
                <Search size={18} /> TRACK ORDER
              </button>
            </div>

            <div style={{
              marginTop: 16, padding: '14px 18px',
              background: 'rgba(255,251,235,0.9)', backdropFilter: 'blur(10px)',
              borderRadius: 12, border: '1px solid rgba(253,230,138,0.5)',
              fontSize: 13, color: '#92400e',
            }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <HelpCircle size={14} /> Where to find your invoice number?
              </strong>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Check your email receipt, SMS confirmation, or the physical receipt from the cashier.
                The invoice number looks like <strong>INV-20260612-0001</strong> or <strong>PRT-20260611-0001</strong>.
              </p>
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && !showModal && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{
              width: 48, height: 48,
              border: '3px solid rgba(226,232,240,0.5)',
              borderTop: '3px solid #059669',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>
              Searching for your order...
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Please wait a moment
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Error state */}
        {error && !result && !showModal && (
          <div style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            borderRadius: 20, border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
            padding: 32, textAlign: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef2f2, #fff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(220,38,38,0.08)',
            }}>
              <AlertTriangle size={36} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', margin: '0 0 12px' }}>
              ORDER NOT FOUND
            </h2>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>
              {error}
            </p>
            <div style={{
              background: '#f8fafc', borderRadius: 12, padding: '16px 20px',
              textAlign: 'left', marginBottom: 16, fontSize: 13, color: '#64748b'
            }}>
              <p style={{ fontWeight: 700, margin: '0 0 8px', color: '#334155' }}>Possible reasons:</p>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
                <li>Invoice number is incorrect</li>
                <li>Phone number does not match the order</li>
                <li>Order was placed more than 60 days ago (archived)</li>
              </ul>
            </div>
            <button onClick={handleTryAgain} style={{
              padding: '12px 32px', background: 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 16px rgba(5,150,105,0.25)',
            }}>
              <ArrowLeft size={16} /> TRY AGAIN
            </button>
          </div>
        )}

        {/* Result Modal Overlay */}
        {showModal && result && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '40px 20px', animation: 'modalBackdrop 0.3s ease',
            overflow: 'auto',
          }} onClick={closeModal}>
            <div className="result-modal" onClick={e => e.stopPropagation()} style={{
              width: '100%', maxWidth: 580, margin: 'auto 0',
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(30px)',
              borderRadius: 24, border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
              animation: 'modalContent 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '24px 28px 16px',
                borderBottom: '1px solid rgba(226,232,240,0.5)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 99,
                    background: `${colors.light}`,
                    color: colors.primary, fontSize: 11, fontWeight: 700,
                    marginBottom: 8, letterSpacing: '0.04em',
                  }}>
                    {Icon} {result.module}
                  </div>
                  <h2 style={{
                    margin: 0, fontSize: 22, fontWeight: 800,
                    background: colors.gradient,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                  }}>
                    {result.order_id}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                    {result.order_date}
                  </p>
                </div>
                <button onClick={closeModal} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#f1f5f9', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <X size={16} color="#64748b" />
                </button>
              </div>

              {/* Stages */}
              <div style={{ padding: '28px 28px 16px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: 24, gap: 4,
                }}>
                  {result.stages.map((stage, i) => (
                    <React.Fragment key={stage.label}>
                      <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                        <div className="stage-dot" style={{
                          width: 42, height: 42, borderRadius: '50%', margin: '0 auto 8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: stage.completed ? colors.gradient : '#f1f5f9',
                          color: stage.completed ? 'white' : '#94a3b8',
                          fontSize: 16, fontWeight: 700,
                          boxShadow: stage.completed ? `0 4px 16px ${colors.primary}40` : 'none',
                          animation: stage.completed ? `stagePopIn 0.5s ease ${i * 0.1}s both` : 'none',
                        }}>
                          {stage.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: stage.completed ? 700 : 500,
                          color: stage.completed ? colors.primary : '#94a3b8',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {stage.label}
                        </div>
                      </div>
                      {i < result.stages.length - 1 && (
                        <div style={{
                          flex: 1, height: 3, alignSelf: 'flex-start',
                          marginTop: 20, background: '#e2e8f0',
                          position: 'relative', minWidth: 6, borderRadius: 2, overflow: 'hidden',
                        }}>
                          <div className="progress-fill" style={{
                            height: '100%', background: colors.gradient,
                            borderRadius: 2,
                            width: result.stages[i].completed ? '100%' : '0%',
                          }} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Status label */}
                <div style={{
                  textAlign: 'center', marginBottom: 20, padding: '14px 16px',
                  background: `linear-gradient(135deg, ${colors.light}, rgba(255,255,255,0.5))`,
                  borderRadius: 12, fontSize: 14, fontWeight: 700, color: colors.primary,
                  border: `1px solid ${colors.primary}18`,
                }}>
                  <Package size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  {result.status_label}
                </div>

                {/* Details */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px',
                  fontSize: 13,
                }}>
                  <DetailRow icon={<Package size={13} />} label="Product" value={result.product} />
                  <DetailRow icon={<CreditCard size={13} />} label="Total Amount" value={`ETB ${result.total_amount?.toLocaleString()}`} />
                  <DetailRow icon={<CheckCircle size={13} />} label="Payment" value={result.payment_status} />
                  {result.estimated_completion && (
                    <DetailRow icon={<Calendar size={13} />} label="Est. Completion" value={result.estimated_completion} />
                  )}
                  {result.pickup_location && (
                    <DetailRow icon={<MapPin size={13} />} label="Pickup Location" value={result.pickup_location} />
                  )}
                  {result.working_hours && (
                    <DetailRow icon={<Clock size={13} />} label="Working Hours" value={result.working_hours} />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 28px', borderTop: '1px solid rgba(226,232,240,0.5)',
                background: 'rgba(248,250,252,0.8)', fontSize: 13, color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                borderRadius: '0 0 24px 24px',
              }}>
                <span><HelpCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Need help? <strong>{result.contact_number}</strong></span>
                <button onClick={handleTryAgain} style={{
                  background: 'none', border: 'none', color: colors.primary,
                  fontWeight: 600, cursor: 'pointer', fontSize: 12, textDecoration: 'underline',
                }}>Track another</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '8px 10px', borderRadius: 8,
    background: '#f8fafc', border: '1px solid #f1f5f9',
  }}>
    <span style={{
      color: '#94a3b8', fontSize: 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {icon} {label}
    </span>
    <span style={{
      color: '#0f172a', fontWeight: 600, fontSize: 13,
      overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{value || '-'}</span>
  </div>
);