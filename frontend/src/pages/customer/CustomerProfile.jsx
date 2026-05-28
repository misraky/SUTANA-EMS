import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import styles from './CustomerProfile.module.css';
const CustomerProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      const res = await customerService.getProfile();
      const data = res?.data?.customer || {};
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await customerService.updateProfile(profile);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      await customerService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setSavingPassword(false);
    }
  };
  if (loading) return <div className={styles.loadingState}>Loading profile...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile Settings</h1>
        <p className={styles.subtitle}>Update your personal information and account security.</p>
      </div>
      <div className={styles.grid}>
        {}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Personal Information</h2>
          {profileMsg.text && (
            <div className={`${styles.alert} ${styles[profileMsg.type]}`}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleProfileUpdate} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                value={profile.email}
                className={styles.input}
                disabled
              />
              <span className={styles.helpText}>Email address cannot be changed.</span>
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={styles.input}
                placeholder="09..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className={styles.textarea}
                rows={3}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
        {}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Security Settings</h2>
          {pwdMsg.text && (
            <div className={`${styles.alert} ${styles[pwdMsg.type]}`}>
              {pwdMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordChange} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={styles.input}
                required
                minLength={8}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={styles.input}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className={styles.btnOutline} disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          <div className={styles.divider}></div>
          <div className={styles.twoFactorSection}>
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account.</p>
            <button className={styles.btnSecondary} disabled>
              Enable 2FA (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CustomerProfile;
