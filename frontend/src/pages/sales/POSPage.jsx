import React, { useState, useEffect, useCallback } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatters';
import styles from './POSPage.module.css';
const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartDetails, setCartDetails] = useState({ subtotal: 0, taxAmount: 0, totalAmount: 0 });
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const fetchCart = async () => {
    try {
      const response = await salesService.getCart();
      const cartData = response.data?.data || response.data;
      if (cartData) {
        setCartItems(cartData.items || []);
        setCartDetails({
          subtotal: cartData.subtotal || 0,
          taxAmount: cartData.taxAmount || 0,
          totalAmount: cartData.totalAmount || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, customersRes] = await Promise.all([
        salesService.getPOSProducts({ limit: 100 }),
        salesService.getCustomers({ limit: 100 })
      ]);
      setProducts(productsRes.data?.products || productsRes.data?.data?.products || []);
      setCustomers(customersRes.data?.customers || customersRes.data?.data?.customers || []);
      await fetchCart();
    } catch (error) {
      console.error('POS Initialization failed:', error);
      setMessage({ type: 'error', text: 'Failed to initialize POS. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  const addToCart = async (product) => {
    try {
      await salesService.addToCart({ productId: product.id, quantity: 1 });
      await fetchCart();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add item' });
      setTimeout(() => setMessage(null), 3000);
    }
  };
  const updateQuantity = async (itemId, delta, currentQty) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    try {
      await salesService.updateCartItem(itemId, { quantity: newQty });
      await fetchCart();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update quantity' });
      setTimeout(() => setMessage(null), 3000);
    }
  };
  const removeFromCart = async (itemId) => {
    try {
      await salesService.removeFromCart(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };
  const clearCart = async () => {
    try {
      await salesService.clearCart();
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'Credit' && !selectedCustomerId) {
      setMessage({ type: 'error', text: 'Credit sales require a customer to be selected.' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    setCheckoutLoading(true);
    try {
      const payload = {
        customerId: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
        paymentMethod,
        amountPaid: paymentMethod === 'Credit' ? 0 : cartDetails.totalAmount
      };
      const response = await salesService.createSale(payload);
      const invoiceNumber = response.data?.invoiceNumber || response.data?.data?.invoiceNumber || 'INV-XXX';
      setMessage({ type: 'success', text: `Sale completed! Invoice: ${invoiceNumber}` });
      setSelectedCustomerId('');
      setPaymentMethod('Cash');
      await fetchCart();
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Checkout failed' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setCheckoutLoading(false);
    }
  };
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );
  if (loading) return <div className={styles.loading}>Initializing POS Terminal...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.mainArea}>
        <div className={styles.searchHeader}>
          <h2 className={styles.title}>Point of Sale</h2>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Search products by SKU or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        {message && (
          <div className={`${styles.alert} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        <div className={styles.productGrid}>
          {filteredProducts.map(product => (
            <div key={product.id} className={styles.productCard} onClick={() => addToCart(product)}>
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <span className={styles.productSku}>{product.sku}</span>
                <span className={styles.productPrice}>{formatCurrency(product.selling_price || product.sellingPrice)}</span>
              </div>
              <div className={styles.productStock}>{product.stock_quantity || 0} in stock</div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className={styles.emptyProducts}>No products found matching '{search}'</div>
          )}
        </div>
      </div>
      <div className={styles.sidebar}>
        <div className={styles.cartHeader}>
          <h2>Current Order</h2>
          <button className={styles.btnClear} onClick={clearCart} disabled={cartItems.length === 0}>
            Clear
          </button>
        </div>
        <div className={styles.customerSelect}>
          <select 
            value={selectedCustomerId} 
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.customerSelect}>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={styles.selectInput}
          >
            <option value="Cash">💵 Cash</option>
            <option value="Credit">🏦 Credit (Invoice)</option>
            <option value="Bank Transfer">🔁 Bank Transfer</option>
          </select>
          {paymentMethod === 'Credit' && !selectedCustomerId && (
            <p style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: '4px' }}>
              ⚠ Select a customer for credit sales
            </p>
          )}
        </div>
        <div className={styles.cartItems}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>Cart is empty</div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <h4 className={styles.itemName}>{item.productName}</h4>
                  <span className={styles.itemPrice}>{formatCurrency(item.unitPrice)}</span>
                </div>
                <div className={styles.itemControls}>
                  <button className={styles.btnQty} onClick={() => updateQuantity(item.id, -1, item.quantity)}>-</button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button className={styles.btnQty} onClick={() => updateQuantity(item.id, 1, item.quantity)}>+</button>
                  <button className={styles.btnRemove} onClick={() => removeFromCart(item.id)}>&times;</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className={styles.cartFooter}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(cartDetails.subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Tax (15%)</span>
            <span>{formatCurrency(cartDetails.taxAmount)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total</span>
            <span>{formatCurrency(cartDetails.totalAmount)}</span>
          </div>
          <button 
            className={styles.btnCheckout} 
            disabled={cartItems.length === 0 || checkoutLoading || (paymentMethod === 'Credit' && !selectedCustomerId)}
            onClick={handleCheckout}
          >
            {checkoutLoading 
              ? 'Processing...' 
              : paymentMethod === 'Credit'
                ? `Issue Invoice ${formatCurrency(cartDetails.totalAmount)}`
                : `Checkout ${formatCurrency(cartDetails.totalAmount)}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};
export default POSPage;
