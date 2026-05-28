import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import inventoryService from '../../services/inventoryService';
import styles from './CreatePurchaseOrder.module.css';
const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    sectorId: '',
    notes: '',
  });
  const [items, setItems] = useState([
    { productName: '', quantityOrdered: 1, unitPrice: 0 }
  ]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, sectorsRes] = await Promise.all([
          purchaseService.getSuppliers({ limit: 100 }),
          purchaseService.getSectors()
        ]);
        setSuppliers(suppliersRes.data?.suppliers || []);
        setSectors(sectorsRes.data?.sectors || sectorsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  const addItem = () => {
    setItems([...items, { productName: '', quantityOrdered: 1, unitPrice: 0 }]);
  };
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        supplierId: parseInt(formData.supplierId),
        expectedDeliveryDate: formData.expectedDeliveryDate,
        sectorId: parseInt(formData.sectorId),
        notes: formData.notes,
        items: items.map(item => ({
          productName: item.productName,
          quantityOrdered: parseInt(item.quantityOrdered),
          unitPrice: parseFloat(item.unitPrice)
        }))
      };
      const response = await purchaseService.createPO(payload);
      setMessage({ type: 'success', text: 'Purchase order created successfully!' });
      setTimeout(() => {
        navigate(`/purchase/orders/${response.data?.poId || response.data?.id || ''}`);
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create PO' });
      setSubmitting(false);
    }
  };
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitPrice), 0);
  };
  if (loading) return <div className={styles.loading}>Loading form...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.btnBack} onClick={() => navigate('/purchase/orders')}>
            &larr; Back
          </button>
          <div>
            <h2 className={styles.title}>Create Purchase Order</h2>
            <p className={styles.subtitle}>Draft a new procurement request</p>
          </div>
        </div>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>General Information</h3>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Supplier</label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className={styles.input}
                required
              >
                <option value="">Select Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Expected Delivery Date</label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Sector/Department</label>
              <select
                name="sectorId"
                value={formData.sectorId}
                onChange={handleInputChange}
                className={styles.input}
                required
              >
                <option value="">Select Sector...</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.itemsHeader}>
            <h3 className={styles.cardTitle}>Order Items</h3>
            <button type="button" className={styles.btnAdd} onClick={addItem}>
              + Add Item
            </button>
          </div>
          <div className={styles.itemsList}>
            <div className={styles.itemHeaderRow}>
              <div className={styles.colName}>Product Description</div>
              <div className={styles.colQty}>Quantity</div>
              <div className={styles.colPrice}>Unit Price</div>
              <div className={styles.colTotal}>Total</div>
              <div className={styles.colAction}></div>
            </div>
            {items.map((item, index) => (
              <div key={index} className={styles.itemRow}>
                <div className={styles.colName}>
                  <input
                    type="text"
                    value={item.productName}
                    onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                    className={styles.input}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className={styles.colQty}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantityOrdered}
                    onChange={(e) => handleItemChange(index, 'quantityOrdered', e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.colPrice}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.colTotal}>
                  <span className={styles.itemTotal}>
                    ${(item.quantityOrdered * item.unitPrice).toFixed(2)}
                  </span>
                </div>
                <div className={styles.colAction}>
                  {items.length > 1 && (
                    <button type="button" className={styles.btnRemove} onClick={() => removeItem(index)}>
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.totalsContainer}>
            <div className={styles.totalsRow}>
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className={styles.totalsRow}>
              <span>VAT (15%):</span>
              <span>${(calculateSubtotal() * 0.15).toFixed(2)} ETB</span>
            </div>
            <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
              <span>Total Amount:</span>
              <span>${(calculateSubtotal() * 1.15).toFixed(2)} ETB</span>
            </div>
          </div>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Additional Information</h3>
          <div className={styles.formGroup}>
            <label className={styles.label}>Notes / Terms</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Any specific instructions for the supplier..."
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="button" className={styles.btnCancel} onClick={() => navigate('/purchase/orders')}>
            Cancel
          </button>
          <button type="submit" className={styles.btnSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreatePurchaseOrder;
