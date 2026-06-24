import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicNav, PublicFooter } from './ServicesPage';
import customerService from '../../services/customerService';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import './PublicLayout.css';
import './TrackOrderPage.css';

const STATUS_STEPS = ['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered'];

const TrackOrderPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const trackedRef = useRef(false);
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlId = searchParams.get('orderId');
    if (urlId && !trackedRef.current) {
      trackedRef.current = true;
      handleTrackInternal(urlId);
    }
  }, []);

  const handleTrackInternal = async (id) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/track-order?orderId=${encodeURIComponent(id)}`);
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    setOrder(null);
    try {
      const res = await customerService.trackOrder(id);
      const { order: o, timeline: t } = res?.data?.data || {};
      if (o) {
        setOrder({
          ...o,
          productType: o.product_type || o.productType,
          dueDate: o.due_date || o.dueDate,
          createdAt: o.created_at || o.createdAt,
        });
        setTimeline(t || []);
      } else {
        setError('No order found with that ID.');
      }
    } catch (err) {
      setError('Order not found or failed to track. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    const trimmed = orderId.trim();
    if (!trimmed) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=/track-order?orderId=${encodeURIComponent(trimmed)}`);
      return;
    }
    handleTrackInternal(trimmed);
  };

  const stepIndex = STATUS_STEPS.indexOf(order?.status);
  const currentStepIndex = stepIndex >= 0 ? stepIndex : -1;

  return (
    <div className="public-page">
      <PublicNav />

      <section className="top-hero">
        <div className="top-hero-blob top-hero-blob--1" />
        <div className="top-hero-blob top-hero-blob--2" />
        <div className="top-hero-inner">
          <span className="top-hero-badge">&#x1F50D; Order Tracking</span>
          <h1>Track Your Order</h1>
          <p>Enter your order ID to check the real-time status of your print jobs and deliveries.</p>

          <form onSubmit={handleTrack} className="top-search-form">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your order ID or number..."
              className="top-search-input"
            />
            <button type="submit" disabled={loading || !orderId.trim()} className="top-search-btn">
              {loading ? 'Tracking...' : '\uD83D\uDD0D Track'}
            </button>
          </form>

          {!isAuthenticated && (
            <p className="top-signin-msg">
              <Link to={`/login?redirect=/track-order`}>Sign in</Link> to track detailed order history.
            </p>
          )}
        </div>
      </section>

      {searched && (
        <section className="top-results">
          {loading && <div className="top-loading">Loading tracking details...</div>}

          {error && !loading && (
            <div className="top-error">
              <div className="top-error-icon">&#x26A0;&#xFE0F;</div>
              <h3>Order Not Found</h3>
              <p>{error}</p>
            </div>
          )}

          {order && !loading && (
            <div>
              <div className="top-order-card">
                <div className="top-order-header">
                  <div>
                    <h2>Order {order.order_number ? `#${order.order_number}` : `#${order.id || ''}`}</h2>
                    <p>Placed on {order.createdAt ? formatDate(order.createdAt) : '-'}</p>
                  </div>
                  <span className="top-order-badge" style={{ background: order.status_color || undefined }}>
                    {order.status || 'Unknown'}
                  </span>
                </div>

                <div className="top-timeline">
                  <div className="top-timeline-track">
                    <div className="top-timeline-line" />
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = currentStepIndex >= 0 && idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      let dotClass = 'top-timeline-dot';
                      if (isCompleted) dotClass += ' top-timeline-dot--completed';
                      else if (isCurrent) dotClass += ' top-timeline-dot--current';
                      return (
                        <div key={step} className="top-timeline-step">
                          <div className={dotClass}>
                            {isCompleted ? '\u2713' : idx + 1}
                          </div>
                          <div className="top-timeline-info">
                            <h4 className={isCompleted || isCurrent ? 'active' : ''}>{step}</h4>
                            {isCurrent && <p>Your order is currently here.</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {timeline.length > 0 && (
                <div className="top-history">
                  <h3>Status History</h3>
                  <div className="top-history-list">
                    {timeline.map((entry, idx) => (
                      <div key={idx} className="top-history-item">
                        <span className={`top-history-dot ${idx === 0 ? 'top-history-dot--latest' : 'top-history-dot--past'}`} />
                        <span className="top-history-status">{entry.status}</span>
                        <span className="top-history-date">{entry.changed_at ? formatDate(entry.changed_at) : ''}</span>
                        {entry.note && <span className="top-history-note">&mdash; {entry.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="top-meta">
                <div className="top-meta-item">
                  <label>Product Type</label>
                  <span>{order.productType || '-'}</span>
                </div>
                <div className="top-meta-item">
                  <label>Quantity</label>
                  <span>{order.quantity || '-'}</span>
                </div>
                <div className="top-meta-item">
                  <label>Estimated Due Date</label>
                  <span>{order.dueDate ? formatDate(order.dueDate) : '-'}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {!searched && (
        <section className="top-empty">
          <div className="top-empty-inner">
            <div className="top-empty-icon">&#x1F50D;</div>
            <h3>Enter Your Order ID</h3>
            <p>
              Use the search bar above to track the current status of any print order.
              You will need to sign in to view full order history and details.
            </p>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
};

export default TrackOrderPage;
