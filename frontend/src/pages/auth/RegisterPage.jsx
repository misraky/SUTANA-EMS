import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './RegisterPage.module.css';
const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Register the customer account
      await authService.register(formData);
      
      // Navigate to login page
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.logo}>SUTANA</div>
          <h2>Create Customer Account</h2>
          <p className={styles.subtitle}>Join SUTANA — manage your orders, track status & more.</p>
          {error && <div className={styles.errorAlert}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Misrak Tsehayneh"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09..."
                required
                pattern="^09[0-9]{8}$"
                title="Must be a valid Ethiopian phone number starting with 09"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <div className={styles.passwordInputWrapper} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className={styles.input}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create My Account'}
            </button>
          </form>
          <p className={styles.loginPrompt}>
            Already have an account? <Link to="/login" className={styles.loginLink}>Sign In</Link>
          </p>
          <p className={styles.staffNote}>
            Are you staff? Your account is created by an administrator — <Link to="/login" className={styles.loginLink}>Sign in here</Link>.
          </p>
        </div>
      </div>
      <div className={styles.imageSection}>
        <div className={styles.imageOverlay}>
          <h1>Empower Your Business</h1>
          <p>Streamline your operations with our enterprise tools.</p>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
