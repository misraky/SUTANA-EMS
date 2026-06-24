import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Clock, LogOut, List, FileText } from 'lucide-react';
import styles from './EmployeePortal.module.css';

const LEAVE_TYPES = ['Sick Leave', 'Annual Leave', 'Personal Leave', 'Maternity Leave', 'Other'];

const EmployeePortal = () => {
  const employeeId = 'EMP-001';
  const computerId = 'PC-001';

  const [attendance, setAttendance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payslip, setPayslip] = useState(null);
  const [clocking, setClocking] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [attRes, leaveRes] = await Promise.all([
        hrService.getMyAttendance(employeeId),
        hrService.getLeaveRequests({ employeeId }),
      ]);
      setAttendance(attRes.data?.data || attRes.data);
      setLeaveRequests(leaveRes.data?.data?.leaves || leaveRes.data?.leaves || []);
    } catch (err) {
      console.error('Failed to fetch portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClockIn = async () => {
    setClocking(true);
    try {
      await hrService.clockIn(employeeId, computerId);
      fetchData();
    } catch (err) {
      alert('Failed to clock in');
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    setClocking(true);
    try {
      await hrService.clockOut(employeeId, computerId);
      fetchData();
    } catch (err) {
      alert('Failed to clock out');
    } finally {
      setClocking(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    try {
      await hrService.createLeaveRequest({ ...leaveForm, employeeId });
      setShowLeaveModal(false);
      setLeaveForm({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err) {
      alert('Failed to submit leave request');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading employee portal...</div>;
  }

  const isClockedIn = !!attendance?.clockInTime;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Employee Portal</h1>
        <p className={styles.pageSubtitle}>Self-service portal for {employeeId}</p>
      </div>

      <div className={styles.clockSection}>
        <div className={styles.clockStatus}>
          <Clock size={20} />
          {isClockedIn
            ? <span>Clocked in at {formatDate(attendance?.clockInTime, 'time')}</span>
            : <span>Currently clocked out</span>
          }
        </div>
        <div className={styles.clockButtons}>
          <button
            className={`${styles.clockBtn} ${styles.clockInBtn}`}
            onClick={handleClockIn}
            disabled={clocking || isClockedIn}
          >
            <LogOut size={24} />
            Clock In
          </button>
          <button
            className={`${styles.clockBtn} ${styles.clockOutBtn}`}
            onClick={handleClockOut}
            disabled={clocking || !isClockedIn}
          >
            <LogOut size={24} />
            Clock Out
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Clock size={18} />
            <h2 className={styles.cardTitle}>Today's Attendance</h2>
          </div>
          <div className={styles.attendanceInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Clock In</span>
              <span className={styles.infoValue}>{attendance?.clockInTime ? formatDate(attendance.clockInTime, 'datetime') : 'Not clocked in'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Clock Out</span>
              <span className={styles.infoValue}>{attendance?.clockOutTime ? formatDate(attendance.clockOutTime, 'datetime') : 'Not clocked out'}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FileText size={18} />
            <h2 className={styles.cardTitle}>My Payslip</h2>
          </div>
          {payslip ? (
            <div className={styles.payslipInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Net Salary</span>
                <span className={styles.infoValue}>{formatCurrency(payslip.netSalary || payslip.net)}</span>
              </div>
            </div>
          ) : (
            <p className={styles.emptyText}>No payslip available for current month.</p>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <List size={18} />
          <h2 className={styles.cardTitle}>My Leave Requests</h2>
          <button className={styles.addBtn} onClick={() => setShowLeaveModal(true)}>+ New Request</button>
        </div>
        {leaveRequests.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((lr, idx) => (
                  <tr key={idx}>
                    <td>{lr.leaveType || lr.leave_type}</td>
                    <td>{formatDate(lr.startDate || lr.start_date)}</td>
                    <td>{formatDate(lr.endDate || lr.end_date)}</td>
                    <td><span className={`${styles.statusBadge} ${styles[lr.status?.toLowerCase()]}`}>{lr.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>No leave requests found.</p>
        )}
      </div>

      {showLeaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLeaveModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Leave Request</h2>
              <button className={styles.closeBtn} onClick={() => setShowLeaveModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitLeave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Leave Type</label>
                  <select
                    className={styles.formInput}
                    value={leaveForm.leaveType}
                    onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  >
                    {LEAVE_TYPES.map(lt => <option key={lt} value={lt}>{lt}</option>)}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Start Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={leaveForm.startDate}
                      onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>End Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={leaveForm.endDate}
                      onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason</label>
                  <textarea
                    className={styles.formInput}
                    rows={3}
                    value={leaveForm.reason}
                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePortal;
