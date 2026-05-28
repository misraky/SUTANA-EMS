import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/dateUtils';
import styles from './AuditLogs.module.css';
const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 50, action: '' });
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await adminService.getAuditLogs(filters);
        setLogs(response.data.logs);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [filters]);
  if (loading) return <div className={styles.loading}>Loading audit trails...</div>;
  return (
    <div className={styles.auditLogs}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Audit Logs</h2>
          <p>Complete history of system changes and user actions</p>
        </div>
        <div className={styles.filters}>
          <select 
            value={filters.action} 
            onChange={(e) => setFilters({...filters, action: e.target.value, page: 1})}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">Logins</option>
            <option value="USER_CREATED">User Creation</option>
            <option value="STOCK_ADJUST">Inventory Changes</option>
            <option value="PAYMENT_PROCESSED">Payments</option>
          </select>
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs && logs.map((log) => (
              <tr key={log.id}>
                <td className={styles.textMuted}>{formatDateTime(log.createdAt || log.created_at)}</td>
                <td>
                  <strong>{log.userName || log.user_name}</strong>
                  <div className={`${styles.textXs} ${styles.textMuted}`}>{log.userRole || log.user_role}</div>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles['action-' + (log.action || '').toLowerCase().split('_')[0]]}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.resource}</td>
                <td className={styles.textSm}>
                  {log.status === 'failed' ? (
                    <span className={styles.textDanger} style={{color: 'red'}}>{log.error_message || 'Failed'}</span>
                  ) : (
                    <span>
                      {log.resource_id ? `ID: ${log.resource_id} ` : ''}
                      {(log.before_state || log.after_state) ? '(State changed)' : 'Success'}
                    </span>
                  )}
                </td>
                <td className={`${styles.textXs} ${styles.textMuted}`}>{log.ipAddress || log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AuditLogs;
