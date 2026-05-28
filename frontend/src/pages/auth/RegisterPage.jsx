import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './RegisterPage.module.css';
const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '' });
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
      await authService.register(formData);
      // Registration complete, route to login or handle auto-login
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <div className={styles.logo}>SUTANA</div>
          <h2>Create Account</h2>
          <p className={styles.subtitle}>Join SUTANA Enterprise Management System.</p>
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
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
          <p className={styles.loginPrompt}>
            Already have an account? <Link to="/login" className={styles.loginLink}>Sign In</Link>
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
