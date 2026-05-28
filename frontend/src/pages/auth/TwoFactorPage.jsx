import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './TwoFactorPage.module.css';
const TwoFactorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  // Check if we came from a valid login process
  useEffect(() => {
    if (!location.state?.require2FA) {
      // In a real app, you might strictly enforce this
      // navigate('/login');
    }
  }, [location, navigate]);
  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return; 
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.verifyTwoFactor(fullCode);
      // Determine dashboard based on role stored in local storage
      const user = authService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      if (user.roles?.includes('Admin')) navigate('/admin');
      else if (user.roles?.includes('CEO')) navigate('/ceo');
      else if (user.roles?.includes('Finance')) navigate('/finance');
      else if (user.roles?.includes('Purchase')) navigate('/purchase');
      else if (user.roles?.includes('Store Worker')) navigate('/store');
      else if (user.roles?.includes('Sales/Cashier')) navigate('/sales');
      else if (user.roles?.includes('Printing Supervisor')) navigate('/printing');
      else navigate('/customer');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleResend = () => {
    alert('A new code has been sent to your device.');
  };
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.iconWrapper}>
          <span>📱</span>
        </div>
        <h2>Two-Factor Authentication</h2>
        <p className={styles.subtitle}>Enter the 6-digit verification code sent to your registered device or authenticator app.</p>
        {error && <div className={styles.errorAlert}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.codeContainer}>
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
                className={styles.codeInput}
                autoFocus={index === 0}
              />
            ))}
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
        <p className={styles.resendPrompt}>
          Didn't receive the code? <button onClick={handleResend} className={styles.resendLink}>Resend</button>
        </p>
        <p className={styles.backPrompt}>
          <Link to="/login" className={styles.backLink}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};
export default TwoFactorPage;
