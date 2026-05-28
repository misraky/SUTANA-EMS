import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './ForgotPasswordPage.module.css';
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await authService.requestPasswordReset(email);
      setStatus({ type: 'success', message: 'Password reset link has been sent to your email.' });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send reset link.' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.iconWrapper}>
          <span>🔒</span>
        </div>
        <h2>Forgot Password</h2>
        <p className={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</p>
        {status.message && (
          <div className={`${styles.alert} ${styles[status.type]}`}>
            {status.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@sutana.com"
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading || status.type === 'success'}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className={styles.backPrompt}>
          <Link to="/login" className={styles.backLink}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
