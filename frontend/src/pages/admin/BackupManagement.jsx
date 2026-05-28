import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/dateUtils';
import styles from './BackupManagement.module.css';
const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    fetchBackups();
  }, []);
  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBackups();
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateBackup = async () => {
    if (!window.confirm('Are you sure you want to create a new backup now?')) return;
    setCreating(true);
    try {
      await adminService.createBackup();
      alert('Backup created successfully');
      fetchBackups();
    } catch (error) {
      alert(error.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };
  const handleRestore = async (backupId) => {
    if (!window.confirm('WARNING: Restoring will overwrite the current database. Are you absolutely sure?')) return;
    try {
      await adminService.restoreBackup(backupId);
      alert('Database restored successfully');
    } catch (error) {
      alert(error.message || 'Failed to restore database');
    }
  };
  const handleDelete = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    try {
      await adminService.deleteBackup(backupId);
      fetchBackups();
    } catch (error) {
      alert(error.message || 'Failed to delete backup');
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return styles.statusCompleted;
      case 'failed': return styles.statusFailed;
      default: return styles.statusPending;
    }
  };
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };
  if (loading && backups.length === 0) return <div className={styles.loading}>Loading backups...</div>;
  return (
    <div className={styles.backupManagement}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Backup Management</h2>
          <p>Create and manage system database backups</p>
        </div>
        <button 
          className={styles.btnPrimary} 
          onClick={handleCreateBackup}
          disabled={creating}
        >
          <i className="icon-database"></i> 
          {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>
      <div className={styles.tableContainer}>
        {backups.length === 0 && !loading ? (
          <div className={styles.emptyState}>No backups found. Create one now.</div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Backup Name</th>
                <th>Date Created</th>
                <th>Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id || backup.file_name}>
                  <td>
                    <strong>{backup.file_name || 'System Backup'}</strong>
                  </td>
                  <td>{formatDateTime(backup.created_at || backup.createdAt)}</td>
                  <td>{formatSize(backup.size)}</td>
                  <td>
                    <span className={`${styles.badge} ${getStatusBadge(backup.status)}`}>
                      {backup.status || 'completed'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button 
                        className={`${styles.btnIcon} ${styles.restore}`} 
                        title="Restore this backup"
                        onClick={() => handleRestore(backup.id)}
                      >
                        <i className="icon-refresh"></i> Restore
                      </button>
                      <button 
                        className={`${styles.btnIcon} ${styles.delete}`} 
                        title="Delete backup"
                        onClick={() => handleDelete(backup.id)}
                      >
                        <i className="icon-trash"></i> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default BackupManagement;
