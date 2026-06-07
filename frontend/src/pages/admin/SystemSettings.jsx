import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import styles from './SystemSettings.module.css';

const TIMEZONES = [
  'Africa/Addis_Ababa',
  'UTC',
  'Africa/Nairobi',
  'Africa/Cairo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await adminService.getSystemSettings();
        setSettings(response.data?.settings || {});
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await adminService.updateSystemSettings(settings);
      setSuccessMsg('✓ Settings saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.message || 'Failed to save settings.');
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
          <p>Configure global application parameters (FR-066)</p>
        </div>
      </div>

      {successMsg && <div className={styles.alert} style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>{successMsg}</div>}
      {errorMsg   && <div className={styles.alert} style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>{errorMsg}</div>}

      <form onSubmit={handleSave} className={styles.settingsForm}>
        <div className={styles.settingsGrid}>

          {/* General */}
          <div className={styles.settingsGroup}>
            <h3>🏢 General Settings</h3>
            <div className={styles.field}>
              <label>System Name</label>
              <input
                type="text"
                value={settings.system_name || ''}
                onChange={(e) => set('system_name', e.target.value)}
                placeholder="e.g. SUTANA EMS"
              />
            </div>
            <div className={styles.field}>
              <label>Currency Code</label>
              <input
                type="text"
                value={settings.currency || 'ETB'}
                onChange={(e) => set('currency', e.target.value)}
                placeholder="ETB"
                maxLength={5}
              />
            </div>
            <div className={styles.field}>
              <label>Default Tax Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={settings.default_tax_rate ?? ''}
                onChange={(e) => set('default_tax_rate', e.target.value)}
                placeholder="e.g. 15"
              />
              <span className={styles.hint}>Applied automatically to invoices and POs if not overridden.</span>
            </div>
          </div>

          {/* Localization */}
          <div className={styles.settingsGroup}>
            <h3>🌍 Localization</h3>
            <div className={styles.field}>
              <label>Timezone</label>
              <select value={settings.timezone || 'Africa/Addis_Ababa'} onChange={(e) => set('timezone', e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <span className={styles.hint}>Used for audit log timestamps and report generation.</span>
            </div>
            <div className={styles.field}>
              <label>Date Format</label>
              <select value={settings.date_format || 'DD/MM/YYYY'} onChange={(e) => set('date_format', e.target.value)}>
                {DATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Security */}
          <div className={styles.settingsGroup}>
            <h3>🔒 Security Settings</h3>
            <div className={styles.field}>
              <label>Session Timeout (Minutes)</label>
              <input
                type="number"
                min={5}
                max={480}
                value={settings.session_timeout_minutes || 30}
                onChange={(e) => set('session_timeout_minutes', e.target.value)}
              />
              <span className={styles.hint}>Users are automatically logged out after this period of inactivity.</span>
            </div>
            <div className={styles.field}>
              <label>Max Login Attempts</label>
              <input
                type="number"
                min={3}
                max={20}
                value={settings.max_failed_attempts || 5}
                onChange={(e) => set('max_failed_attempts', e.target.value)}
              />
              <span className={styles.hint}>Account is temporarily locked after this many consecutive failed logins.</span>
            </div>
          </div>

        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;
