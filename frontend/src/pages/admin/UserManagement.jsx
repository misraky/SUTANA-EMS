import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/dateUtils';
import AddUserModal from './AddUserModal';
import styles from './UserManagement.module.css';
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      const response = await adminService.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, { status: newStatus });
      fetchUsers();
    } catch (error) {
      alert('Failed to update user status');
    }
  };
  if (loading) return <div className={styles.loading}>Loading users...</div>;
  return (
    <div className={styles.userManagement}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>User Management</h2>
          <p>Manage system access and roles</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setSelectedUser(null); setShowModal(true); }}>
          <i className="icon-plus"></i> Add New User
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatarSmall}>{user.fullName ? user.fullName.charAt(0) : '?'}</div>
                    <span>{user.fullName}</span>
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
                  <span className={`${styles.badge} ${styles.statusBadge} ${styles[user.status_name || user.status]}`}>
                    {user.status_name || user.status}
                  </span>
                </td>
                <td>{formatDate(user.lastLogin || user.last_login)}</td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={styles.btnIcon} title="Edit" onClick={() => { setSelectedUser(user); setShowModal(true); }}>
                      <i className="icon-edit"></i>
                    </button>
                    <button 
                      className={`${styles.btnIcon} ${styles.delete}`} 
                      title="Deactivate"
                      onClick={() => handleStatusChange(user.id, 'inactive')}
                    >
                      <i className="icon-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
