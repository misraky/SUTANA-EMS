import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HRHome from './HRHome';
import HREmployees from './HREmployees';
import HRAttendance from './HRAttendance';
import HRLeaves from './HRLeaves';
import HRPayroll from './HRPayroll';
import EmployeePortal from './EmployeePortal';
import styles from './HRDashboard.module.css';

const HRDashboard = () => {
  const menuItems = [
    { label: 'HR Home',      path: '/hr/home',        icon: 'bar-chart' },
    { label: 'Employees',    path: '/hr/employees',    icon: 'users' },
    { label: 'Attendance',   path: '/hr/attendance',   icon: 'clipboard' },
    { label: 'Leave Requests', path: '/hr/leaves',     icon: 'file-text' },
    { label: 'Payroll',      path: '/hr/payroll',      icon: 'wallet' },
    { label: 'Employee Portal', path: '/hr/portal',    icon: 'user' },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="HR Dashboard">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="home"       element={<HRHome />} />
            <Route path="employees"  element={<HREmployees />} />
            <Route path="attendance" element={<HRAttendance />} />
            <Route path="leaves"     element={<HRLeaves />} />
            <Route path="payroll"    element={<HRPayroll />} />
            <Route path="portal"     element={<EmployeePortal />} />
            <Route path="/"          element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default HRDashboard;
