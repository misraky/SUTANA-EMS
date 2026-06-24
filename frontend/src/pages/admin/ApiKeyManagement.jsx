import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatters';
import styles from './ApiKeyManagement.module.css';

const ApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', scopes: '', expirationDate: '', rateLimit: '' });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const response = await adminService.getApiKeys();
      setApiKeys(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        scopes: form.scopes.split(',').map((s) => s.trim()).filter(Boolean),
        rateLimit: form.rateLimit ? Number(form.rateLimit) : undefined,
        expirationDate: form.expirationDate || undefined
      };
      await adminService.createApiKey(payload);
      setShowCreate(false);
      setForm({ name: '', description: '', scopes: '', expirationDate: '', rateLimit: '' });
      fetchKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await adminService.revokeApiKey(id);
      fetchKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const handleRotate = async (id) => {
    if (!window.confirm('Rotate this API key? The old key will be invalidated.')) return;
    try {
      await adminService.rotateApiKey(id);
      fetchKeys();
    } catch (error) {
      console.error('Failed to rotate API key:', error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading API keys...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>API Key Management</h2>
          <p>Manage API keys for programmatic access</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>Create API Key</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Scopes</th>
              <th>Expiration</th>
              <th>Last Used</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>{key.description || '-'}</td>
                <td>{Array.isArray(key.scopes) ? key.scopes.join(', ') : (key.scopes || '-')}</td>
                <td>{formatDate(key.expirationDate || key.expiration_date)}</td>
                <td>{formatDate(key.lastUsed || key.last_used)}</td>
                <td>
                  <span className={`${styles.badge} ${styles[(key.status || 'active') === 'active' ? 'statusActive' : 'statusInactive']}`}>
                    {key.status}
                  </span>
                </td>
                <td>
                  <div className={styles.flex}>
                    <button className={styles.btnOutline} onClick={() => handleRotate(key.id)}>Rotate</button>
                    <button className={styles.btnDanger} onClick={() => handleRevoke(key.id)}>Revoke</button>
                  </div>
                </td>
              </tr>
            ))}
            {apiKeys.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No API keys found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className={styles.overlay}>
          <div className={styles.section}>
            <h3>Create API Key</h3>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className={styles.formGroup}>
                <label>Scopes (comma-separated)</label>
                <input value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} placeholder="read:users,write:reports" />
              </div>
              <div className={styles.formGroup}>
                <label>Expiration Date</label>
                <input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Rate Limit (requests/min)</label>
                <input type="number" value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: e.target.value })} />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary}>Create</button>
                <button type="button" className={styles.btnOutline} onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;
