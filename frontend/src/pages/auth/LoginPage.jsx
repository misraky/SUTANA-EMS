import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './LoginPage.module.css';
const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authService.login(formData);
      const userRoles = user.roles ? user.roles.map(r => r.toLowerCase()) : [];
      if (userRoles.includes('admin')) navigate('/admin');
      else if (userRoles.includes('ceo')) navigate('/ceo');
      else if (userRoles.includes('finance')) navigate('/finance');
      else if (userRoles.includes('purchase')) navigate('/purchase');
      else if (userRoles.includes('store manager')) navigate('/store');
      else if (userRoles.includes('sales/cashier')) navigate('/sales');
      else if (userRoles.includes('printing supervisor')) navigate('/printing');
      else navigate('/customer');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.imageSection}>
        <div className={styles.imageOverlay}>
          <h1>Welcome to SUTANA</h1>
          <p>Enterprise Management System</p>
        </div>
      </div>
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.logo}>SUTANA</div>
          <h2>Sign In</h2>
          <p className={styles.subtitle}>Enter your credentials to access your dashboard.</p>
          {error && <div className={styles.errorAlert}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Email or Phone Number</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. user@sutana.com or 09..."
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <div className={styles.passwordHeader}>
                <label>Password</label>
                <Link to="/auth/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className={styles.registerPrompt}>
            Don't have an account? <Link to="/auth/register" className={styles.registerLink}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
