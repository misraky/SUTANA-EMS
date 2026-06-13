import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';

const FarmingReportsApproval = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We didn't build this endpoint in the controller either, 
    // but this represents the Finance end of the flow.
    // Finance sees all 'SUBMITTED' reports from farming workers.
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    // Mocked for UI purposes as per instruction flow
    setReports([]); 
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Farming Daily Handover Reports</h2>
      <p>Review and approve daily sales and cash handover from the Farming department.</p>

      {loading ? <p>Loading reports...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: 'white' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Date</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Worker ID</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>System Sales</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Cash Handed Over</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Difference</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Status</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No pending handover reports found</td></tr>
            ) : (
              reports.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{new Date(r.report_date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{r.farming_worker_id}</td>
                  <td style={{ padding: '12px' }}>{r.total_system_sales} ETB</td>
                  <td style={{ padding: '12px' }}>{r.physical_cash_counted} ETB</td>
                  <td style={{ padding: '12px', color: r.difference_amount < 0 ? '#ef4444' : (r.difference_amount > 0 ? '#10b981' : '#64748b') }}>
                    {r.difference_amount} ETB
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef3c7', color: '#d97706', fontSize: '12px' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Review & Approve</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FarmingReportsApproval;
