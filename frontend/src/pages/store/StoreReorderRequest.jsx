import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import purchaseService from '../../services/purchaseService';
import styles from './StoreDashboard.module.css';

const StoreReorderRequest = () => {
  const [searchParams] = useSearchParams();
  const skuParam = searchParams.get('sku');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getInventory();
      const items = response.data?.products || [];
      setAllProducts(items);
      
      if (skuParam) {
        const matched = items.find(p => p.sku === skuParam);
        if (matched) {
          setProduct(matched);
        } else {
          setMessage({ type: 'error', text: 'Product from URL not found.' });
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setMessage({ type: 'error', text: 'Failed to fetch product list.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const matched = allProducts.find(p => p.id === selectedId);
    setProduct(matched || null);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);
    setMessage(null);
    try {
      // Build the payload expected by purchase.controller.js
      const payload = {
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        items: [
          {
            productId: product.id,
            productName: product.name,
            quantityOrdered: parseInt(quantity, 10),
            unitPrice: product.average_cost || 0 // Reorder with last known cost
          }
        ],
        notes: `REORDER REQUEST: ${notes}`
      };

      await purchaseService.createPO(payload);
      setMessage({ type: 'success', text: 'Reorder request submitted successfully! Purchase department has been notified.' });
      setQuantity(1);
      setNotes('');
      
      // Navigate back after a short delay
      setTimeout(() => navigate('/store/inventory'), 2500);
    } catch (error) {
      console.error('Failed to submit reorder request:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container || 'p-6'} style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
        Create Reorder Request
      </h2>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Submit a request to the Purchase department to restock this item.
      </p>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#b91c1c' : '#15803d',
          border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#bbf7d0'}`
        }}>
          {message.text}
        </div>
      )}

      {loading && !allProducts.length ? (
        <div>Loading products...</div>
      ) : (
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Select Product to Reorder
            </label>
            <select
              value={product?.id || ''}
              onChange={handleProductSelect}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              <option value="">-- Choose a product --</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) - Stock: {p.current_stock}
                </option>
              ))}
            </select>
          </div>

          {product && (
            <>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Current Stock</span>
                    <p style={{ fontWeight: '600', fontSize: '1.125rem', color: product.current_stock <= product.reorder_level ? '#ef4444' : '#10b981' }}>
                      {product.current_stock}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Reorder Level</span>
                    <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>{product.reorder_level}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Quantity to Reorder
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{ width: '100%', maxWidth: '300px', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Notes for Purchase Team (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    placeholder="E.g., Need this urgently by Friday, high demand..."
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/store/inventory')}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? 'Submitting...' : 'Submit Reorder Request'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreReorderRequest;
