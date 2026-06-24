import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatters';
import styles from './TenantManagement.module.css';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', isolationLevel: 'logical' });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await adminService.getTenants();
      setTenants(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      await adminService.createTenant(newTenant);
      setShowCreate(false);
      setNewTenant({ name: '', isolationLevel: 'logical' });
      fetchTenants();
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  const handleViewAudit = async (tenant) => {
    setSelectedTenant(tenant);
    setAuditLoading(true);
    try {
      const response = await adminService.getTenantAudit(tenant.id);
      setAuditTrail(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      setAuditTrail([]);
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading tenants...</div>;

  return (
    <div className={styles.tenantManagement}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Tenant Management</h2>
          <p>Manage multi-tenancy isolation and tenancy audit</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>Create Tenant</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Isolation Level</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>{tenant.name}</td>
                <td>{tenant.isolationLevel || tenant.isolation_level}</td>
                <td>
                  <span className={`${styles.badge} ${styles.statusBadge} ${styles[(tenant.status || 'active') === 'active' ? 'active' : 'inactive']}`}>
                    {tenant.status}
                  </span>
                </td>
                <td>{formatDate(tenant.created_at || tenant.createdAt)}</td>
                <td>
                  <button className={styles.btnSecondary} onClick={() => handleViewAudit(tenant)}>
                    View Audit
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No tenants found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTenant && (
        <div className={styles.auditSection}>
          <div className={styles.sectionHeader}>
            <h3>Audit Trail — {selectedTenant.name}</h3>
            <button className={styles.btnSecondary} onClick={() => setSelectedTenant(null)}>Close</button>
          </div>
          {auditLoading ? (
            <div className={styles.loading}>Loading audit trail...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Performed By</th>
                    <th>Timestamp</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.map((entry, i) => (
                    <tr key={entry.id || i}>
                      <td>{entry.action}</td>
                      <td>{entry.performedBy || entry.performed_by}</td>
                      <td>{formatDate(entry.timestamp || entry.created_at)}</td>
                      <td>{entry.details || '-'}</td>
                    </tr>
                  ))}
                  {auditTrail.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No audit entries found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create Tenant</h3>
            <form onSubmit={handleCreateTenant}>
              <div className={styles.formGroup}>
                <label>Tenant Name</label>
                <input required value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Isolation Level</label>
                <select value={newTenant.isolationLevel} onChange={(e) => setNewTenant({ ...newTenant, isolationLevel: e.target.value })}>
                  <option value="logical">Logical</option>
                  <option value="schema">Schema</option>
                  <option value="database">Database</option>
                  <option value="instance">Instance</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary}>Create</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
