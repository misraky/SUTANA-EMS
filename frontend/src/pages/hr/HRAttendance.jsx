import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatDate } from '../../utils/formatters';
import styles from './HRAttendance.module.css';

const FIELD_STATUSES = ['Present', 'Absent', 'On Leave', 'On Assignment'];

const HRAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fieldForm, setFieldForm] = useState({ employeeId: '', status: 'Present', notes: '' });
  const [fieldSubmitting, setFieldSubmitting] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, empRes] = await Promise.all([
        hrService.getDailyAttendances(date),
        hrService.getEmployees({}),
      ]);
      setAttendances(attRes.data?.data?.attendances || attRes.data?.data || []);
      setEmployees(empRes.data?.data?.employees || empRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    setFieldSubmitting(true);
    try {
      await hrService.clockIn(fieldForm.employeeId, 'FIELD');
      fetchAttendance();
      setFieldForm({ employeeId: '', status: 'Present', notes: '' });
    } catch (err) {
      alert('Failed to mark field employee');
    } finally {
      setFieldSubmitting(false);
    }
  };

  const getStatus = (att) => {
    if (att.clockInTime || att.clock_in_time) {
      if (att.status === 'Late' || att.isLate) return 'late';
      return 'present';
    }
    if (att.clockOutTime || att.clock_out_time) return 'present';
    if (att.status === 'Absent' || att.isAbsent) return 'absent';
    if (att.status === 'On Leave' || att.isOnLeave) return 'absent';
    return 'absent';
  };

  const statusDisplay = (att) => {
    const s = getStatus(att);
    if (s === 'present') return <span className={styles.statusPresent}>✅ Present</span>;
    if (s === 'late') return <span className={styles.statusLate}>⚠️ Late</span>;
    return <span className={styles.statusAbsent}>❌ Absent</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Attendance</h1>
          <p className={styles.pageSubtitle}>Daily attendance records</p>
        </div>
        <input
          type="date"
          className={styles.dateInput}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading attendance...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length === 0 ? (
                  <tr><td colSpan={5} className={styles.emptyCell}>No attendance records for this date.</td></tr>
                ) : (
                  attendances.map((att, idx) => (
                    <tr key={idx}>
                      <td className={styles.nameCell}>{att.fullName || att.full_name || att.employeeName || att.employee_name}</td>
                      <td>{att.department}</td>
                      <td>{att.clockInTime || att.clock_in_time ? formatDate(att.clockInTime || att.clock_in_time, 'time') : '-'}</td>
                      <td>{att.clockOutTime || att.clock_out_time ? formatDate(att.clockOutTime || att.clock_out_time, 'time') : '-'}</td>
                      <td>{statusDisplay(att)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.fieldSection}>
            <h2 className={styles.sectionTitle}>Field Employee Marking</h2>
            <form className={styles.fieldForm} onSubmit={handleFieldSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Employee</label>
                <select
                  className={styles.formInput}
                  value={fieldForm.employeeId}
                  onChange={e => setFieldForm({ ...fieldForm, employeeId: e.target.value })}
                  required
                >
                  <option value="">Select employee...</option>
                  {employees.filter(e => (e.workType || e.work_type) === 'Field').map((emp, idx) => (
                    <option key={idx} value={emp.employeeId || emp.employee_id}>
                      {emp.fullName || emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select
                  className={styles.formInput}
                  value={fieldForm.status}
                  onChange={e => setFieldForm({ ...fieldForm, status: e.target.value })}
                >
                  {FIELD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <input
                  className={styles.formInput}
                  value={fieldForm.notes}
                  onChange={e => setFieldForm({ ...fieldForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={fieldSubmitting}>
                {fieldSubmitting ? 'Submitting...' : 'Mark Attendance'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default HRAttendance;
