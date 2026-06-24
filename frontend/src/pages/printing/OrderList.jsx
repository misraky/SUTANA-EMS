import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import printingService from '../../services/printingService';
import { formatDate } from '../../utils/formatters';
import OrdersLayout from '../../components/orders/OrdersLayout';
import OrderCard from '../../components/orders/OrderCard';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);

  const tabs = [
    { id: 'ALL', label: 'All', count: orders.length, badgeColor: 'progress' },
    { id: 'Received', label: 'Received' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Quality Check', label: 'Quality Check' },
    { id: 'Ready', label: 'Ready' },
    { id: 'Delivered', label: 'Delivered' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await printingService.getOrders({ limit: 100 });
      setOrders(response.data?.orders || response.data?.rows || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load printing orders.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'ALL' || o.status_name === activeTab;
    const matchesSearch = !searchTerm || 
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleToggleSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) {
      setOrders(orders.filter(o => !selectedOrders.includes(o.id)));
      setSelectedOrders([]);
    }
  };

  return (
    <OrdersLayout
      title="Printing Orders"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreateOrder={() => navigate('/printing/orders/create')}
      onExport={() => console.log('Exporting printing orders')}
      loading={loading}
      empty={orders.length === 0}
      emptyMessage={error || "No orders found. Create a new order to get started."}
      selectedCount={selectedOrders.length}
      totalCount={filteredOrders.length}
      onSelectAll={handleSelectAll}
      onDeleteSelected={handleDeleteSelected}
      onPrintSelected={() => window.print()}
    >
      {filteredOrders.length > 0 ? filteredOrders.map(order => (
        <OrderCard
          key={order.id}
          orderId={order.order_number || `PRT-${order.id}`}
          isSelected={selectedOrders.includes(order.id)}
          onSelect={() => handleToggleSelect(order.id)}
          status={order.status_name || 'Received'}
          amount=""
          date={formatDate(order.due_date)}
          referenceLabel="Due Date"
          referenceNo={formatDate(order.due_date)}
          providerLogo="Printing Dept"
          actionOptions={[
            { value: order.status_name || 'Received', label: order.status_name || 'Received' }
          ]}
          currentAction={order.status_name || 'Received'}
          items={[
            {
              name: order.product_type || 'Custom Print',
              sku: order.customer_name || 'Walk-in',
              quantity: order.quantity,
              icon: '🖨️',
              meta: [
                { label: 'Paper', value: order.paper_type || 'A4' },
                { label: 'Color', value: order.color_printing ? 'Color' : 'B&W' },
                { label: 'Pages', value: `${order.pages_per_copy || 1} pgs` }
              ]
            }
          ]}
          onClick={() => navigate(`/printing/orders/${order.id}`)}
          extraContent={{
            actions: (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/printing/orders/${order.id}`);
                }}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'background 0.2s' }}
              >
                View Details
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

export default OrderList;
