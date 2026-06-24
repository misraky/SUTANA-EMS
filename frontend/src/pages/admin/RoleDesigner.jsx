import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import styles from './RoleDesigner.module.css';

const RoleDesigner = () => {
  const [singleRoles, setSingleRoles] = useState([]);
  const [compositeRoles, setCompositeRoles] = useState([]);
  const [permissionMatrix, setPermissionMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [srForm, setSrForm] = useState({ name: '', module: '', function: '', scope: '', permissions: '' });
  const [crForm, setCrForm] = useState({ name: '', description: '', single_role_ids: '' });
  const [editingSr, setEditingSr] = useState(null);
  const [editingCr, setEditingCr] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [srRes, crRes, pmRes] = await Promise.all([
        adminService.getSingleRoles(),
        adminService.getCompositeRoles(),
        adminService.getPermissionMatrix()
      ]);
      setSingleRoles(srRes.data?.roles || srRes.data || []);
      setCompositeRoles(crRes.data?.roles || crRes.data || []);
      setPermissionMatrix(pmRes.data?.matrix || pmRes.data || []);
    } catch (error) {
      console.error('Failed to fetch role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSr = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...srForm,
        permissions: srForm.permissions.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (editingSr) {
        await adminService.updateSingleRole(editingSr.id, data);
      } else {
        await adminService.createSingleRole(data);
      }
      setSrForm({ name: '', module: '', function: '', scope: '', permissions: '' });
      setEditingSr(null);
      fetchAll();
    } catch (error) {
      alert(error.message || 'Failed to save single role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSr = (role) => {
    setEditingSr(role);
    setSrForm({
      name: role.name,
      module: role.module || '',
      function: role.function || role.func || '',
      scope: role.scope || '',
      permissions: (role.permissions || []).join(', ')
    });
  };

  const handleDeleteSr = async (id) => {
    if (!window.confirm('Delete this single role?')) return;
    try {
      await adminService.deleteSingleRole(id);
      fetchAll();
    } catch (error) {
      alert(error.message || 'Failed to delete role');
    }
  };

  const handleCreateCr = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...crForm,
        single_role_ids: crForm.single_role_ids.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (editingCr) {
        await adminService.updateCompositeRole(editingCr.id, data);
      } else {
        await adminService.createCompositeRole(data);
      }
      setCrForm({ name: '', description: '', single_role_ids: '' });
      setEditingCr(null);
      fetchAll();
    } catch (error) {
      alert(error.message || 'Failed to save composite role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCr = (role) => {
    setEditingCr(role);
    setCrForm({
      name: role.name,
      description: role.description || '',
      single_role_ids: (role.single_role_ids || role.singleRoleIds || []).join(', ')
    });
  };

  const handleDeleteCr = async (id) => {
    if (!window.confirm('Delete this composite role?')) return;
    try {
      await adminService.deleteCompositeRole(id);
      fetchAll();
    } catch (error) {
      alert(error.message || 'Failed to delete composite role');
    }
  };

  if (loading) return <div className={styles.loading}>Loading role designer...</div>;

  return (
    <div className={styles.roleDesigner}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Role Designer</h2>
          <p>Design and manage roles and permissions</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Single Roles ({singleRoles.length})</h3>
          <form onSubmit={handleCreateSr} className={styles.formInline}>
            <input className={styles.filterInput} placeholder="Name" value={srForm.name} onChange={(e) => setSrForm({ ...srForm, name: e.target.value })} required />
            <input className={styles.filterInput} placeholder="Module" value={srForm.module} onChange={(e) => setSrForm({ ...srForm, module: e.target.value })} />
            <input className={styles.filterInput} placeholder="Function" value={srForm.function} onChange={(e) => setSrForm({ ...srForm, function: e.target.value })} />
            <input className={styles.filterInput} placeholder="Scope" value={srForm.scope} onChange={(e) => setSrForm({ ...srForm, scope: e.target.value })} />
            <input className={styles.filterInput} placeholder="Permissions (comma-separated)" value={srForm.permissions} onChange={(e) => setSrForm({ ...srForm, permissions: e.target.value })} />
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Saving...' : (editingSr ? 'Update' : 'Create')}
              </button>
              {editingSr && (
                <button type="button" className={styles.btnSecondary} onClick={() => { setEditingSr(null); setSrForm({ name: '', module: '', function: '', scope: '', permissions: '' }); }}>Cancel</button>
              )}
            </div>
          </form>

          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Module</th>
                  <th>Function</th>
                  <th>Scope</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {singleRoles.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.module}</td>
                    <td>{r.function || r.func}</td>
                    <td>{r.scope}</td>
                    <td>{(r.permissions || []).join(', ')}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.btnSecondary} onClick={() => handleEditSr(r)}>Edit</button>
                        <button className={styles.btnDanger} onClick={() => handleDeleteSr(r.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {singleRoles.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No single roles defined.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Composite Roles ({compositeRoles.length})</h3>
          <form onSubmit={handleCreateCr} className={styles.formInline}>
            <input className={styles.filterInput} placeholder="Name" value={crForm.name} onChange={(e) => setCrForm({ ...crForm, name: e.target.value })} required />
            <input className={styles.filterInput} placeholder="Description" value={crForm.description} onChange={(e) => setCrForm({ ...crForm, description: e.target.value })} />
            <input className={styles.filterInput} placeholder="Single Role IDs (comma-separated)" value={crForm.single_role_ids} onChange={(e) => setCrForm({ ...crForm, single_role_ids: e.target.value })} />
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Saving...' : (editingCr ? 'Update' : 'Create')}
              </button>
              {editingCr && (
                <button type="button" className={styles.btnSecondary} onClick={() => { setEditingCr(null); setCrForm({ name: '', description: '', single_role_ids: '' }); }}>Cancel</button>
              )}
            </div>
          </form>

          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Single Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {compositeRoles.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.description}</td>
                    <td>{(r.single_role_ids || r.singleRoleIds || []).join(', ')}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.btnSecondary} onClick={() => handleEditCr(r)}>Edit</button>
                        <button className={styles.btnDanger} onClick={() => handleDeleteCr(r.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {compositeRoles.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No composite roles defined.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Permission Matrix</h3>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Module</th>
                <th>Permission</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{row.role_name || row.roleName || row.role}</td>
                  <td>{row.module}</td>
                  <td>{row.permission}</td>
                  <td>{row.scope}</td>
                </tr>
              ))}
              {permissionMatrix.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No permission matrix data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleDesigner;
