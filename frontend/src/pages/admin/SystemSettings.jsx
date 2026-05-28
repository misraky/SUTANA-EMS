import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import styles from './SystemSettings.module.css';
const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await adminService.getSystemSettings();
        setSettings(response.data.settings || {});
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.updateSystemSettings(settings);
      alert('Settings saved successfully');
    } catch (error) {
      alert('Failed to save settings');
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
      <form onSubmit={handleSave} className={styles.settingsForm}>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsGroup}>
            <h3>General Settings</h3>
            <div className={styles.field}>
              <label>System Name</label>
              <input 
                type="text" 
                value={settings.system_name || ''} 
                onChange={(e) => setSettings({...settings, system_name: e.target.value})}
              />
            </div>
            <div className={styles.field}>
              <label>Currency Code</label>
              <input 
                type="text" 
                value={settings.currency || 'ETB'} 
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
              />
            </div>
          </div>
          <div className={styles.settingsGroup}>
            <h3>Security Settings</h3>
            <div className={styles.field}>
              <label>Session Timeout (Minutes)</label>
              <input 
                type="number" 
                value={settings.session_timeout_minutes || 30} 
                onChange={(e) => setSettings({...settings, session_timeout_minutes: e.target.value})}
              />
            </div>
            <div className={styles.field}>
              <label>Max Login Attempts</label>
              <input 
                type="number" 
                value={settings.max_failed_attempts || 5} 
                onChange={(e) => setSettings({...settings, max_failed_attempts: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default SystemSettings;
