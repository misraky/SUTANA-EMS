import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import carService from '../../services/carService';
import { Printer, Sprout, ShoppingCart, Package, Car, Pill, Search, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

const ORDER_TYPES = [
  { key: 'all', label: 'All Orders', icon: null },
  { key: 'printing', label: 'Printing', icon: <Printer size={16} />, color: '#3b82f6' },
  { key: 'farming', label: 'Farming', icon: <Sprout size={16} />, color: '#059669' },
  { key: 'retail', label: 'Retail', icon: <Package size={16} />, color: '#d97706' },
  { key: 'rental', label: 'Car Rental', icon: <Car size={16} />, color: '#8b5cf6' },
  { key: 'prescription', label: 'Pharmacy', icon: <Pill size={16} />, color: '#ec4899' },
];

export default function CustomerAllOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results = [];

      const printingP = apiClient.get('/printing/customer/orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data?.orders || []).forEach(o => results.push({
              id: `prt-${o.id}`, type: 'printing', typeLabel: 'Printing',
              orderNumber: o.order_number, date: o.created_at, status: o.status_name || o.status_code,
              amount: o.total_price, description: `${o.product_type || ''} ${o.quantity ? `(${o.quantity} copies)` : ''}`,
              navPath: '/customer/printing-orders', icon: <Printer size={18} />, color: '#3b82f6',
            }));
          }
        }).catch(() => {});

      const farmingP = apiClient.get('/farming/orders/my-orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `farm-${o.id}`, type: 'farming', typeLabel: 'Farming',
              orderNumber: o.invoice_number, date: o.created_at, status: o.status,
              amount: o.total_amount, description: `${o.delivery_type || ''} ${o.items?.length ? `(${o.items.length} items)` : ''}`,
              navPath: '/customer/farming-orders', icon: <Sprout size={18} />, color: '#059669',
            }));
          }
        }).catch(() => {});

      const retailP = apiClient.get('/retail/orders/my-orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `ret-${o.id}`, type: 'retail', typeLabel: 'Retail',
              orderNumber: o.invoice_number, date: o.created_at, status: o.status,
              amount: o.total_amount, description: o.items?.map(i => i.product_name).join(', ')?.slice(0, 80) || '',
              navPath: '/customer/retail-orders', icon: <Package size={18} />, color: '#d97706',
            }));
          }
        }).catch(() => {});

      const rentalP = carService.getMyRentalOrders()
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `rent-${o.id}`, type: 'rental', typeLabel: 'Car Rental',
              orderNumber: o.orderNumber, date: o.createdAt || o.created_at, status: o.status,
              amount: o.totalAmount, description: `${o.carName || ''} ${o.driverName ? `(${o.driverName})` : ''}`,
              navPath: '/customer/rentals', icon: <Car size={18} />, color: '#8b5cf6',
            }));
          }
        }).catch(() => {});

      const prescriptionP = apiClient.get('/pharmacy/requests/my-requests')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `rx-${o.id}`, type: 'prescription', typeLabel: 'Pharmacy',
              orderNumber: o.prescription_number || `RX-${o.id}`, date: o.created_at, status: o.status,
              amount: null, description: `${o.medications?.length || 0} medications`,
              navPath: '/customer/prescriptions', icon: <Pill size={18} />, color: '#ec4899',
            }));
          }
        }).catch(() => {});

      await Promise.all([printingP, farmingP, retailP, rentalP, prescriptionP]);
      results.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setOrders(results);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    let list = activeTab === 'all' ? orders : orders.filter(o => o.type === activeTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        o.typeLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeTab, search]);

  const statusBadge = (status) => {
    if (!status) return { label: 'Unknown', bg: '#f1f5f9', color: '#64748b' };
    const s = status.toUpperCase().replace(/\s+/g, '_');
    if (['COMPLETED', 'DELIVERED', 'PAID'].some(x => s.includes(x))) return { label: status, bg: '#f0fdf4', color: '#059669' };
    if (['CANCELLED', 'REJECTED'].some(x => s.includes(x))) return { label: status, bg: '#fef2f2', color: '#dc2626' };
    if (['PROCESSING', 'PENDING', 'SHIPPED', 'APPROVED'].some(x => s.includes(x))) return { label: status, bg: '#fffbeb', color: '#d97706' };
    return { label: status, bg: '#f1f5f9', color: '#64748b' };
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
      <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading all orders...</div>
    </div>
  );

  return (
    <div style={{ padding: '0 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#111827' }}>All Orders</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>View and track all your orders in one place</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ORDER_TYPES.map(tab => {
            const count = tab.key === 'all' ? orders.length : orders.filter(o => o.type === tab.key).length;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                  borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: activeTab === tab.key ? `2px solid ${tab.color || '#059669'}` : '1px solid #e2e8f0',
                  background: activeTab === tab.key ? `${tab.color || '#059669'}10` : 'white',
                  color: activeTab === tab.key ? (tab.color || '#059669') : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon} {tab.label} <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px' }}>
          <Search size={16} color="#94a3b8" />
          <input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, minWidth: 180, background: 'transparent' }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <ShoppingCart size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#475569' }}>No orders found</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{search ? 'Try a different search term.' : 'Place your first order to get started.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(order => {
            const badge = statusBadge(order.status);
            return (
              <div key={order.id} onClick={() => navigate(order.navPath)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'white', borderRadius: 10, padding: '13px 16px',
                  border: '1px solid #e2e8f0', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = order.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${order.color}12`, color: order.color, flexShrink: 0 }}>
                  {order.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                      {order.orderNumber || `#${order.id}`}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{order.date ? new Date(order.date).toLocaleDateString() : ''}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.description || `${order.typeLabel} order`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {order.amount && (
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                      {Number(order.amount).toLocaleString()} ETB
                    </span>
                  )}
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: badge.bg, color: badge.color, whiteSpace: 'nowrap',
                  }}>
                    {badge.label.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
