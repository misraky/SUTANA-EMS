import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';
import styles from './ForceChangePasswordPage.module.css';

const ForceChangePasswordPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Call the global auth change password endpoint
      await apiClient.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      // Update local storage so that mustChangePassword is false
      const user = authService.getCurrentUser();
      if (user) {
        user.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(user));
      }

      setStatus({ type: 'success', message: 'Password changed successfully!' });

      setTimeout(() => {
        // Redirect to their respective home dashboard
        if (user?.roles?.includes('Admin')) navigate('/admin');
        else if (user?.roles?.includes('CEO')) navigate('/ceo');
        else if (user?.roles?.includes('Finance')) navigate('/finance');
        else if (user?.roles?.includes('Purchase')) navigate('/purchase');
        else if (user?.roles?.includes('Store Worker')) navigate('/store');
        else if (user?.roles?.includes('Sales/Cashier')) navigate('/sales');
        else if (user?.roles?.includes('Printing Supervisor')) navigate('/printing');
        else navigate('/customer');
      }, 1500);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update password. Make sure it contains at least 8 characters, an uppercase letter, a number, and a special character.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.iconWrapper}>
          <span>🔑</span>
        </div>
        <h2>Change Your Password</h2>
        <p className={styles.subtitle}>
          For your account security, you are required to change your temporary password on your first login.
        </p>

        {status.message && (
          <div className={`${styles.alert} ${styles[status.type]}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Temporary Password</label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="At least 8 characters with Upper, Number & Symbol"
              required
              minLength={8}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter new password"
              required
              minLength={8}
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading || status.type === 'success'}>
            {loading ? 'Updating...' : 'Change Password & Continue'}
          </button>
        </form>

        <p className={styles.backPrompt}>
          <button onClick={handleLogout} className={styles.backLink} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Logout & cancel
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
