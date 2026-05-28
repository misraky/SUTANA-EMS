import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import { formatDate } from '../../utils/formatters';
import styles from './SupportTickets.module.css';
const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchTickets();
  }, []);
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await customerService.getSupportTickets({ limit: 50 });
      setTickets(res?.data?.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await customerService.createSupportTicket(form);
      setForm({ subject: '', message: '' });
      setShowModal(false);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Support Center</h1>
          <p className={styles.subtitle}>Need help? Create a support ticket and we'll get back to you.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + New Ticket
        </button>
      </div>
      {loading ? (
        <div className={styles.loadingState}>Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No support tickets found.</p>
        </div>
      ) : (
        <div className={styles.ticketList}>
          {tickets.map((ticket) => (
            <div key={ticket.id} className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                <span className={`${styles.badge} ${styles[ticket.status]}`}>
                  {ticket.status}
                </span>
              </div>
              <p className={styles.ticketMessage}>{ticket.message}</p>
              <div className={styles.ticketFooter}>
                <span>Ticket #{ticket.id}</span>
                <span>{formatDate(ticket.createdAt, 'short')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Create Support Ticket</h2>
            {error && <div className={styles.errorAlert}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  minLength={5}
                  maxLength={200}
                  placeholder="E.g., Issue with Order #123"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  className={styles.textarea}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SupportTickets;
