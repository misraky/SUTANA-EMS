import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import customerService from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import OrdersLayout from '../../components/orders/OrdersLayout';
import OrderCard from '../../components/orders/OrderCard';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const fetchId = useRef(0);

  const tabs = [
    { id: 'ALL', label: 'All', count: pagination.total, badgeColor: 'progress' },
    { id: 'Received', label: 'Received' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Ready', label: 'Ready' },
    { id: 'Delivered', label: 'Delivered' }
  ];

  const fetchOrders = async (page = 1, filter = '') => {
    const id = ++fetchId.current;
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter && filter !== 'ALL') params.status = filter;
      
      const res = await customerService.getOrders(params);
      if (id !== fetchId.current) return;
      const data = res?.data || {};
      const normalizedOrders = (data.orders || []).map(o => ({
      const response = await customerService.getAllOrders();
      setOrders(response.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'ALL' || o.status === activeTab;
    const matchesSearch = !searchTerm || 
      o._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleToggleSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(o => o._id || o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) {
      setOrders(orders.filter(o => !selectedOrders.includes(o._id || o.id)));
      setSelectedOrders([]);
      console.log('Deleted orders:', selectedOrders);
    }
  };

  return (
    <OrdersLayout
      title="Customer Orders"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreateOrder={() => navigate('/orders/new')}
      onExport={() => console.log('Exporting...')}
      loading={loading}
      empty={orders.length === 0}
      emptyMessage="No customer orders found."
      selectedCount={selectedOrders.length}
      totalCount={filteredOrders.length}
      onSelectAll={handleSelectAll}
      onDeleteSelected={handleDeleteSelected}
      onPrintSelected={() => window.print()}
      onUpdateSelected={() => console.log('Update selected', selectedOrders)}
      onDownloadSelected={() => console.log('Download selected', selectedOrders)}
    >
      {filteredOrders.length > 0 ? filteredOrders.map(order => (
        <OrderCard
          key={order._id || order.id}
          orderId={order._id || order.id}
          isSelected={selectedOrders.includes(order._id || order.id)}
          onSelect={() => handleToggleSelect(order._id || order.id)}
          status={order.status}
          amount={formatCurrency(order.totalAmount)}
          date={formatDate(order.dueDate)}
          referenceLabel="Due Date"
          referenceNo={formatDate(order.dueDate)}
          providerLogo="SUTANA Express"
          actionOptions={[
            { value: order.status, label: order.status }
          ]}
          currentAction={order.status}
          items={[
            {
              name: order.productType,
              sku: `PRD-${order.id}`,
              quantity: order.quantity,
              icon: '🛍️'
            }
          ]}
          extraContent={{
            actions: (
              <button 
                onClick={() => navigate(`/customer/orders/${order.id}/track`)}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
              >
                Track Order
              </button>
            )
          }}
        />
      )) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          No orders match your search or filter.
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            ← Prev
          </button>
          <span style={{ alignSelf: 'center' }}>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next →
          </button>
        </div>
      )}
    </OrdersLayout>
  );
};

export default CustomerOrders;
