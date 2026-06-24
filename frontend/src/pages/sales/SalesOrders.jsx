import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import salesService from '../../services/salesService';
import OrdersLayout from '../../components/orders/OrdersLayout';
import OrderCard from '../../components/orders/OrderCard';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SalesOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);

  const tabs = [
    { id: 'ALL', label: 'All', count: orders.length, badgeColor: 'progress' },
    { id: 'Pending', label: 'Pending' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Refunded', label: 'Refunded' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Assuming a generic getSales() or similar endpoint
      const response = await salesService.getSales({ limit: 100 });
      setOrders(response.data?.sales || response.data || []);
    } catch (err) {
      console.error('Failed to fetch sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'ALL' || (o.status && o.status === activeTab) || (!o.status && activeTab === 'Completed');
    const matchesSearch = !searchTerm || 
      o.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} sales records?`)) {
      setOrders(orders.filter(o => !selectedOrders.includes(o.id)));
      setSelectedOrders([]);
    }
  };

  return (
    <OrdersLayout
      title="Sales Orders"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreateOrder={() => navigate('/sales/pos')}
      onExport={() => console.log('Exporting sales orders')}
      loading={loading}
      empty={orders.length === 0}
      emptyMessage="No sales found."
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
          key={order.id}
          orderId={order.invoice_number || `INV-${order.id}`}
          isSelected={selectedOrders.includes(order.id)}
          onSelect={() => handleToggleSelect(order.id)}
          status={order.status || 'Completed'}
          amount={formatCurrency(order.total_amount)}
          date={formatDate(order.sale_date)}
          referenceLabel="Payment Type"
          referenceNo={order.payment_method || 'Cash'}
          providerLogo="Sales"
          actionOptions={[
            { value: 'Pending', label: 'Pending' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Refunded', label: 'Refunded' }
          ]}
          currentAction={order.status || 'Completed'}
          items={order.items ? order.items.map(item => ({
            name: item.product_name,
            sku: `Qty: ${item.quantity}`,
            quantity: item.quantity,
            icon: '🛍️'
          })) : [
            {
              name: 'Various Items',
              sku: 'Multiple',
              quantity: order.total_items || 1,
              icon: '🛍️'
            }
          ]}
          onClick={() => console.log('View sale details', order.id)}
          extraContent={{
            actions: (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // navigate(`/sales/orders/${order.id}`);
                }}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'background 0.2s' }}
              >
                View Receipt
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

export default SalesOrders;
