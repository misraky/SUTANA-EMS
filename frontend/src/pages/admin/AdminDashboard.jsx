import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminHome from './AdminHome';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import AuditLogs from './AuditLogs';
import BackupManagement from './BackupManagement';
import styles from './AdminDashboard.module.css';
const AdminDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/admin/overview', icon: 'dashboard' },
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Customers', path: '/customer', icon: 'users' },
    { label: 'Purchase Orders', path: '/purchase/orders', icon: 'clipboard' },
    { label: 'Audit Logs', path: '/admin/audit', icon: 'clipboard' },
    { label: 'Backups', path: '/admin/backups', icon: 'database' },
    { label: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];
  return (
    <div className={styles.adminDashboard}>
      <DashboardLayout menuItems={menuItems}>
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview" element={<AdminHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="backups" element={<BackupManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};
export default AdminDashboard;
