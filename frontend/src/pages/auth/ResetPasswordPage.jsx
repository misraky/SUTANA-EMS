import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './ResetPasswordPage.module.css';
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  useEffect(() => {
    // Extract token from URL query params
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setStatus({ type: 'error', message: 'Invalid or missing reset token.' });
    }
  }, [location]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await authService.confirmPasswordReset({
        token,
        newPassword: formData.newPassword
      });
      setStatus({ type: 'success', message: 'Password has been reset successfully.' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to reset password. The token may have expired.' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.iconWrapper}>
          <span>🔑</span>
        </div>
        <h2>Reset Password</h2>
        <p className={styles.subtitle}>Please enter your new password below.</p>
        {status.message && (
          <div className={`${styles.alert} ${styles[status.type]}`}>
            {status.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              className={styles.input}
              disabled={!token || status.type === 'success'}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              className={styles.input}
              disabled={!token || status.type === 'success'}
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading || !token || status.type === 'success'}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className={styles.backPrompt}>
          <Link to="/login" className={styles.backLink}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};
export default ResetPasswordPage;
