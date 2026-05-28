import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import RecordExpenseModal from './RecordExpenseModal';
const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    fetchExpenses();
  }, []);
  const fetchExpenses = async () => {
    try {
      const response = await financeService.getExpenses();
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Finance: Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <div className="loading">Calculating expenditures...</div>;
  return (
    <div className="expenses-list">
      <div className="section-header">
        <div>
          <h2>Business Expenses</h2>
          <p>Manage and track all operational costs</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <i className="icon-plus"></i> Record Expense
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Entered By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{formatDate(e.date)}</td>
                <td>
                  <span className="badge category-badge">{e.categoryName}</span>
                </td>
                <td className="max-w-xs truncate">{e.description}</td>
                <td>{e.paymentMethod}</td>
                <td className="font-bold text-red">{formatCurrency(e.amount)}</td>
                <td className="text-sm">{e.enteredByName}</td>
                <td>
                  <span className={`badge ${e.approvedBy ? 'approved' : 'pending'}`}>
                    {e.approvedBy ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon" title="View Receipt"><i className="icon-file"></i></button>
                    {!e.approvedBy && <button className="btn-icon delete" title="Delete"><i className="icon-trash"></i></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RecordExpenseModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSuccess={fetchExpenses} 
      />
    </div>
  );
};
export default ExpensesList;
