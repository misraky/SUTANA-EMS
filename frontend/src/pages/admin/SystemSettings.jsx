import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import apiClient from '../../services/apiClient';
import styles from './SystemSettings.module.css';

const TIMEZONES = [
  'Africa/Addis_Ababa', 'UTC', 'Africa/Nairobi', 'Africa/Cairo',
  'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai',
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, socialRes] = await Promise.all([
          adminService.getSystemSettings(),
          adminService.getSocialLinks()
        ]);
        setSettings(settingsRes.data?.settings || {});
        setSocialLinks(socialRes?.data || []);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setErrorMsg('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSocialChange = (platform, field, value) => {
    setSocialLinks(prev => prev.map(link => 
      link.platform === platform ? { ...link, [field]: value } : link
    ));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await Promise.all([
        adminService.updateSystemSettings(settings),
        adminService.updateSocialLinks(socialLinks)
      ]);
      setSuccessMsg('\u2713 Settings saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to their default values? This cannot be undone.')) return;
    setSaving(true);
    try {
      await apiClient.post('/admin/settings/reset');
      const response = await adminService.getSystemSettings();
      setSettings(response.data?.settings || {});
      setSuccessMsg('\u2713 Settings reset to defaults.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.message || 'Failed to reset settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading settings...</div>;

  return (
    <div className={styles.systemSettings}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>System Settings</h2>
          <p>Configure global application parameters</p>
        </div>
      </div>

      {successMsg && <div className={styles.alert} style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>{successMsg}</div>}
      {errorMsg   && <div className={styles.alert} style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>{errorMsg}</div>}

      <form onSubmit={handleSave} className={styles.settingsForm}>
        <div className={styles.settingsGrid}>

          {/* General */}
          <div className={styles.settingsGroup}>
            <h3>General Settings</h3>
            <div className={styles.field}>
              <label>System Name</label>
              <input type="text" value={settings.system_name || ''} onChange={(e) => set('system_name', e.target.value)} placeholder="e.g. SUTANA EMS" />
            </div>
            <div className={styles.field}>
              <label>Currency Code</label>
              <input type="text" value={settings.currency || 'ETB'} onChange={(e) => set('currency', e.target.value)} placeholder="ETB" maxLength={5} />
            </div>
            <div className={styles.field}>
              <label>Timezone</label>
              <select value={settings.timezone || 'Africa/Addis_Ababa'} onChange={(e) => set('timezone', e.target.value)}>
                {TIMEZONES.map((tz) => (<option key={tz} value={tz}>{tz}</option>))}
              </select>
              <span className={styles.hint}>Used for audit log timestamps and report generation.</span>
            </div>
            <div className={styles.field}>
              <label>Date Format</label>
              <select value={settings.date_format || 'YYYY-MM-DD'} onChange={(e) => set('date_format', e.target.value)}>
                {DATE_FORMATS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
              </select>
            </div>
          </div>

          {/* Backup */}
          <div className={styles.settingsGroup}>
            <h3>Backup Schedule</h3>
            <div className={styles.field}>
              <label>Auto Backup Time</label>
              <input type="time" value={settings.auto_backup_time || '23:00'} onChange={(e) => set('auto_backup_time', e.target.value)} />
              <span className={styles.hint}>Daily backup runs at this time (24-hour format).</span>
            </div>
            <div className={styles.field}>
              <label>Backup Retention (days)</label>
              <input type="number" min={7} max={365} value={settings.backup_retention_days || 30} onChange={(e) => set('backup_retention_days', e.target.value)} />
              <span className={styles.hint}>Backup files older than this are automatically deleted.</span>
            </div>
            <div className={styles.field}>
              <label>Backup Enabled</label>
              <select value={settings.backup_enabled ?? 'true'} onChange={(e) => set('backup_enabled', e.target.value)}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>

          {/* Security */}
          <div className={styles.settingsGroup}>
            <h3>Security Settings</h3>
            <div className={styles.field}>
              <label>Session Timeout (Minutes)</label>
              <input type="number" min={5} max={480} value={settings.session_timeout_minutes || 30} onChange={(e) => set('session_timeout_minutes', e.target.value)} />
              <span className={styles.hint}>Users are automatically logged out after this period of inactivity.</span>
            </div>
            <div className={styles.field}>
              <label>Max Login Attempts</label>
              <input type="number" min={3} max={20} value={settings.max_failed_attempts || 5} onChange={(e) => set('max_failed_attempts', e.target.value)} />
              <span className={styles.hint}>Account is temporarily locked after this many consecutive failed logins.</span>
            </div>
            <div className={styles.field}>
              <label>Password Expiry (Days)</label>
              <input type="number" min={30} max={365} value={settings.password_expiry_days || 90} onChange={(e) => set('password_expiry_days', e.target.value)} />
              <span className={styles.hint}>Users must change their password after this many days.</span>
            </div>
            <div className={styles.field}>
              <label>2FA Required</label>
              <select value={settings.two_factor_required ?? 'false'} onChange={(e) => set('two_factor_required', e.target.value)}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>

          {/* Social Media Links */}
          <div className={styles.settingsGroup}>
            <h3>Social Media Links</h3>
            <p className={styles.hint} style={{ marginBottom: '15px' }}>Enter URLs to display social icons in the public footer. Leave blank to hide.</p>
            {socialLinks.map(link => (
              <div className={styles.field} key={link.platform}>
                <label style={{ textTransform: 'capitalize' }}>{link.platform}</label>
                <input 
                  type="url" 
                  value={link.url || ''} 
                  onChange={(e) => handleSocialChange(link.platform, 'url', e.target.value)} 
                  placeholder={`https://${link.platform}.com/...`} 
                />
              </div>
            ))}
          </div>

        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.btnSecondary} onClick={handleReset} disabled={saving} style={{ marginRight: 'auto' }}>
            Reset to Defaults
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;