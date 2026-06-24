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
        id: o.id,
        orderNumber: o.order_number,
        productType: o.product_type || o.productType,
        quantity: o.quantity,
        totalAmount: o.total_price || o.totalAmount,
        dueDate: o.due_date || o.dueDate,
        status: o.status,
        phone: o.customer_phone
      }));
      setOrders(normalizedOrders);
      setPagination({
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      });
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
    </OrdersLayout>
  );
};

export default CustomerOrders;
