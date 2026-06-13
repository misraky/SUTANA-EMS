import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './AuditLogs.module.css';

const ACTION_CATEGORIES = [
  { value: '', label: 'All Actions' },
  { value: 'LOGIN_SUCCESS', label: 'Login Success' },
  { value: 'LOGIN_FAILED', label: 'Login Failed' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_UPDATED', label: 'User Updated' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
  { value: 'STOCK_ADJUST', label: 'Stock Adjustment' },
  { value: 'PAYMENT_PROCESSED', label: 'Payment Processed' },
  { value: 'PO_CREATED', label: 'PO Created' },
  { value: 'PO_APPROVED', label: 'PO Approved' },
  { value: 'PASSWORD_CHANGED', label: 'Password Changed' },
];

const JsonDiffViewer = ({ before, after }) => {
  let beforeObj = null;
  let afterObj = null;
  try { beforeObj = before ? JSON.parse(before) : null; } catch { beforeObj = before; }
  try { afterObj = after ? JSON.parse(after) : null; } catch { afterObj = after; }

  if (!beforeObj && !afterObj) return <span className={styles.textMuted}>—</span>;

  return (
    <div className={styles.diffViewer}>
      {beforeObj && (
        <div className={styles.diffBefore}>
          <span className={styles.diffLabel}>Before</span>
          <pre className={styles.diffCode}>{JSON.stringify(beforeObj, null, 2)}</pre>
        </div>
      )}
      {afterObj && (
        <div className={styles.diffAfter}>
          <span className={styles.diffLabel}>After</span>
          <pre className={styles.diffCode}>{JSON.stringify(afterObj, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (action) params.action = action;
      if (resource) params.resource = resource;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await adminService.getAuditLogs(params);
      setLogs(response.data?.logs || []);
      setPagination(response.data?.pagination || { total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, action, resource, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeClass = (act = '') => {
    if (act.includes('FAIL') || act.includes('ERROR') || act.includes('BLOCKED')) return styles.badgeDanger;
    if (act.includes('DELETE')) return styles.badgeWarning;
    if (act.includes('LOGIN') || act.includes('CREATE') || act.includes('APPROVED')) return styles.badgeSuccess;
    return styles.badgeDefault;
  };

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  return (
    <div className={styles.auditLogs}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Audit Logs</h2>
          <p>Complete, immutable history of all system changes and user actions</p>
        </div>
        <div className={styles.totalBadge}>{pagination.total || 0} total records</div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchRow}>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Search by user, IP, resource ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={styles.btnSecondary}>Search</button>
        </form>
        <div className={styles.filterRow}>
          <select className={styles.filterInput} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            {ACTION_CATEGORIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Resource (e.g. users)"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          />
          <input type="date" className={styles.filterInput} value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          <span className={styles.textMuted}>to</span>
          <input type="date" className={styles.filterInput} value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          <button className={styles.btnSecondary} onClick={() => { setSearch(''); setAction(''); setResource(''); setStartDate(''); setEndDate(''); setPage(1); }}>
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Loading audit trails...</div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className={expandedRow === log.id ? styles.rowExpanded : styles.row}
                    onClick={() => (log.before_state || log.after_state) && toggleRow(log.id)}
                    style={{ cursor: (log.before_state || log.after_state) ? 'pointer' : 'default' }}
                  >
                    <td className={styles.textMuted} style={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    <td>
                      <strong>{log.full_name || log.userName || 'System'}</strong>
                      {log.email && <div className={`${styles.textXs} ${styles.textMuted}`}>{log.email}</div>}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.resource || '—'}</td>
                    <td className={`${styles.textXs} ${styles.textMuted}`}>{log.ip_address || '—'}</td>
                    <td>
                      {log.status === 'failed' ? (
                        <span className={styles.textDanger}>{log.error_message || 'Failed'}</span>
                      ) : (log.before_state || log.after_state) ? (
                        <button className={styles.btnExpand} onClick={(e) => { e.stopPropagation(); toggleRow(log.id); }}>
                          {expandedRow === log.id ? '▲ Hide Diff' : '▼ Show Diff'}
                        </button>
                      ) : (
                        <span className={styles.textSuccess}>✓ Success</span>
                      )}
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr className={styles.expandedContent}>
                      <td colSpan="6">
                        <JsonDiffViewer before={log.before_state} after={log.after_state} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="6" className={styles.emptyState}>No audit logs found for the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.btnSecondary} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className={styles.textMuted}>Page {page} of {pagination.totalPages}</span>
          <button className={styles.btnSecondary} disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
