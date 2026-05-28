import React, { useState, useEffect } from 'react';
import printingService from '../../services/printingService';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
const TaxReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await printingService.getTaxReceipts();
        setReceipts(response.data.receipts);
      } catch (error) {
        console.error('Printing: Failed to fetch tax receipts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);
  if (loading) return <div className="loading">Loading tax compliance data...</div>;
  return (
    <div className="tax-receipts">
      <div className="section-header">
        <div>
          <h2>Tax Receipts</h2>
          <p>Manage officially generated tax receipts for completed orders</p>
        </div>
        <button className="btn-secondary"><i className="icon-download"></i> Export to Excel</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date Issued</th>
              <th>Customer</th>
              <th>Order #</th>
              <th>Subtotal</th>
              <th>Tax (15%)</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(receipt => (
              <tr key={receipt.id}>
                <td className="font-mono font-bold">{receipt.receiptNumber}</td>
                <td>{formatDate(receipt.issuedAt)}</td>
                <td>{receipt.customerName}</td>
                <td className="text-sm text-muted">{receipt.orderNumber}</td>
                <td>{formatCurrency(receipt.subtotal)}</td>
                <td>{formatCurrency(receipt.taxAmount)}</td>
                <td className="font-bold">{formatCurrency(receipt.totalAmount)}</td>
                <td>
                  <span className={`badge status-${receipt.status.toLowerCase()}`}>
                    {receipt.status}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon" title="View/Print PDF"><i className="icon-printer"></i></button>
                    {receipt.status === 'Draft' && (
                      <button className="btn-icon text-green" title="Finalize"><i className="icon-check"></i></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-8 text-muted">No tax receipts generated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TaxReceipts;
