import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await financeService.getPayments();
        setPayments(response.data.payments);
      } catch (error) {
        console.error('Finance: Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);
  if (loading) return <div className="loading">Retrieving payment records...</div>;
  return (
    <div className="payments-list">
      <div className="section-header">
        <div>
          <h2>Payments Received</h2>
          <p>History of all inbound financial transactions</p>
        </div>
        <div className="header-stats">
          <div className="small-stat">
            <span className="label">Total Received:</span>
            <span className="value">{formatCurrency(payments.reduce((acc, p) => acc + p.amount, 0))}</span>
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference #</th>
              <th>Invoice / Order</th>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Processed By</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.processedAt)}</td>
                <td className="font-mono text-sm">{p.referenceNumber || 'N/A'}</td>
                <td>{p.invoiceNumber || p.orderNumber}</td>
                <td>
                  <span className="method-tag">{p.paymentMethod}</span>
                </td>
                <td className="font-bold text-green">{formatCurrency(p.amount)}</td>
                <td>
                  <span className={`badge status-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </td>
                <td className="text-sm">{p.processedByName}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted">No payments recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PaymentsList;
