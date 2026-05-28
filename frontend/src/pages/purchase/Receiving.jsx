import React, { useState, useEffect } from 'react';
import purchaseService from '../../services/purchaseService';
import { formatNumber } from '../../utils/formatters';
import styles from './Receiving.module.css';
const Receiving = () => {
  const [pendingReceiving, setPendingReceiving] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [receiveData, setReceiveData] = useState([]);
  const [receivingNote, setReceivingNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    fetchPendingReceiving();
  }, []);
  const fetchPendingReceiving = async () => {
    try {
      const response = await purchaseService.getPendingReceiving();
      // Using the exact unwrapping logic like we did across the purchase module
      setPendingReceiving(response.data?.pendingReceiving || response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch pending receiving:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSelectPO = (po) => {
    setSelectedPO(po);
    // Since pending POs from the list might not have items populated, we need to fetch the full PO
    fetchPODetails(po.po_id || po.id);
  };
  const fetchPODetails = async (id) => {
    try {
      const response = await purchaseService.getPOById(id);
      const fullPo = response.data?.purchaseOrder || response.data?.order;
      if (fullPo && fullPo.items) {
        setReceiveData(fullPo.items.map(item => ({
          poItemId: item.id,
          productName: item.product_name,
          quantityOrdered: item.quantity_ordered,
          quantityReceived: item.quantity_ordered - (item.quantity_received || 0),
          quantityDamaged: 0,
          qualityPass: true
        })));
      }
    } catch (error) {
      console.error('Failed to fetch PO details:', error);
      setMessage({ type: 'error', text: 'Failed to load PO items' });
    }
    setMessage(null);
  };
  const handleItemChange = (index, field, value) => {
    const updated = [...receiveData];
    updated[index][field] = value;
    setReceiveData(updated);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await purchaseService.registerReceiving({
        poId: selectedPO.po_id || selectedPO.id,
        items: receiveData.map(item => ({
          poItemId: item.poItemId,
          quantityReceived: parseInt(item.quantityReceived),
          quantityDamaged: parseInt(item.quantityDamaged),
          qualityPass: item.qualityPass
        })),
        receivingNote
      });
      setMessage({ type: 'success', text: 'Items received successfully!' });
      setSelectedPO(null);
      fetchPendingReceiving();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to receive items' });
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <div className={styles.loading}>Loading pending purchase orders...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Goods Receiving</h2>
        <p className={styles.subtitle}>Register incoming stock from suppliers</p>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      {!selectedPO ? (
        <div className={styles.poList}>
          {pendingReceiving.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{fontSize: 48, marginBottom: 16}}>📦</div>
              <p>No pending purchase orders to receive right now.</p>
            </div>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingReceiving.map(po => (
                  <tr key={po.po_id || po.id}>
                    <td className={styles.poNumber}>#{po.po_number}</td>
                    <td>{po.supplier_name}</td>
                    <td>{new Date(po.expected_delivery_date).toLocaleDateString()}</td>
                    <td>
                      <span className={styles.badge}>{po.po_status || po.status}</span>
                    </td>
                    <td>
                      <button onClick={() => handleSelectPO(po)} className={styles.btnSecondary}>
                        Receive Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className={styles.receiveForm}>
          <div className={styles.formHeader}>
            <h3>Receiving PO #{selectedPO.po_number}</h3>
            <button onClick={() => setSelectedPO(null)} className={styles.btnLink}>
              &larr; Back to List
            </button>
          </div>
          {receiveData.length === 0 ? (
            <div className={styles.loading}>Loading order items...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.itemsTableWrapper}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Received Now</th>
                      <th>Damaged</th>
                      <th>Quality Pass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveData.map((item, index) => (
                      <tr key={item.poItemId}>
                        <td><strong>{item.productName}</strong></td>
                        <td>{item.quantityOrdered}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.quantityOrdered}
                            value={item.quantityReceived}
                            onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                            className={styles.inputSmall}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={item.quantityDamaged}
                            onChange={(e) => handleItemChange(index, 'quantityDamaged', e.target.value)}
                            className={styles.inputSmall}
                          />
                        </td>
                        <td>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={item.qualityPass}
                              onChange={(e) => handleItemChange(index, 'qualityPass', e.target.checked)}
                            />
                            Pass
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Receiving Notes</label>
                <textarea
                  value={receivingNote}
                  onChange={(e) => setReceivingNote(e.target.value)}
                  className={styles.textarea}
                  placeholder="Any issues with delivery, packaging, etc."
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
export default Receiving;
