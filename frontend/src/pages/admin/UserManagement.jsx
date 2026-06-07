import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatters';
import AddUserModal from './AddUserModal';
import styles from './UserManagement.module.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, showDeleted]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        search,
        roleId: roleFilter,
        statusId: statusFilter,
        page,
        limit: 10,
        includeDeleted: showDeleted
      });
      setUsers(response.data?.users || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'inactive' ? 'soft-delete' : 'restore'} this user?`)) return;
    try {
      await adminService.updateUserStatus(userId, { status: newStatus });
      fetchUsers();
    } catch (error) {
      alert(error.message || 'Failed to update user status');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminService.exportUsers({ search, roleId: roleFilter, statusId: statusFilter, includeDeleted: showDeleted });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed');
    }
  };

  return (
    <div className={styles.userManagement}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>User Management</h2>
          <p>Manage system access, roles, and accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={styles.btnSecondary} onClick={handleExport}>
            <i className="icon-download"></i> Export CSV
          </button>
          <button className={styles.btnPrimary} onClick={() => { setSelectedUser(null); setShowModal(true); }}>
            <i className="icon-plus"></i> Add New User
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input 
            type="text" 
            className={styles.filterInput}
            placeholder="Search name, email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <button type="submit" className={styles.btnSecondary}>Search</button>
        </form>
        <select className={styles.filterInput} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="1">Admin</option>
          <option value="2">CEO</option>
          <option value="3">Finance</option>
          <option value="4">Purchase</option>
          <option value="5">Store Worker</option>
          <option value="6">Sales/Cashier</option>
          <option value="7">Printing Supervisor</option>
          <option value="8">Customer</option>
        </select>
        <select className={styles.filterInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="1">Active</option>
          <option value="2">Inactive</option>
        </select>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
          Show Deleted
        </label>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Roles</th>
                <th>Status</th>
                <th>2FA</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ opacity: user.deleted_at ? 0.6 : 1 }}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatarSmall}>{user.fullName ? user.fullName.charAt(0) : '?'}</div>
                      <span>{user.fullName} {user.deleted_at && '(Deleted)'}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.department_name || user.department}</td>
                  <td>
                    {user.roles && user.roles.map((role, idx) => (
                      <span key={idx} className={`${styles.badge} ${styles.roleBadge}`}>{role.name || role}</span>
                    ))}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.statusBadge} ${styles[(user.status_name || user.status) === 'active' ? 'active' : 'inactive']}`}>
                      {user.status_name || user.status}
                    </span>
                  </td>
                  <td>
                    {user.two_factor_enabled ? <span className={`${styles.badge} ${styles.statusBadge} ${styles.active}`}>On</span> : <span className={`${styles.badge} ${styles.roleBadge}`}>Off</span>}
                  </td>
                  <td>{formatDate(user.lastLogin || user.last_login)}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      {!user.deleted_at ? (
                        <>
                          <button className={styles.btnIcon} title="Edit" onClick={() => { setSelectedUser(user); setShowModal(true); }}>
                            <i className="icon-edit"></i> Edit
                          </button>
                          <button 
                            className={`${styles.btnIcon} ${styles.delete}`} 
                            title="Soft Delete"
                            onClick={() => handleStatusChange(user.id, 'inactive')}
                          >
                            <i className="icon-trash"></i> Delete
                          </button>
                        </>
                      ) : (
                        <button 
                          className={styles.btnSecondary} 
                          title="Restore"
                          onClick={() => handleStatusChange(user.id, 'active')}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.btnSecondary} disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button className={styles.btnSecondary} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <AddUserModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={fetchUsers} 
        initialData={selectedUser} 
      />
    </div>
  );
};

export default UserManagement;
