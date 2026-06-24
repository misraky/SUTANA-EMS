import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminHome from './AdminHome';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import AuditLogs from './AuditLogs';
import BackupManagement from './BackupManagement';
import RoleDesigner from './RoleDesigner';
import TenantManagement from './TenantManagement';
import DisasterRecovery from './DisasterRecovery';
import ApiKeyManagement from './ApiKeyManagement';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/admin/overview', icon: 'dashboard' },
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Role Designer', path: '/admin/role-designer', icon: 'settings' },
    { label: 'Tenants', path: '/admin/tenants', icon: 'database' },
    { label: 'Disaster Recovery', path: '/admin/dr', icon: 'database' },
    { label: 'API Keys', path: '/admin/api-keys', icon: 'settings' },
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
            <Route path="role-designer" element={<RoleDesigner />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="dr" element={<DisasterRecovery />} />
            <Route path="api-keys" element={<ApiKeyManagement />} />
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