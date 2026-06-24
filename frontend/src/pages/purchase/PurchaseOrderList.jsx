import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import OrdersLayout from '../../components/orders/OrdersLayout';
import OrderCard from '../../components/orders/OrderCard';

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await purchaseService.getPurchaseOrders();
      setOrders(response.data?.orders || []);
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'ALL' || o.status_name === activeTab;
    const matchesSearch = !searchTerm || 
      o.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: 'ALL', label: 'All', count: orders.length, badgeColor: 'progress' },
    { id: 'Draft', label: 'Draft' },
    { id: 'Ordered', label: 'Ordered' },
    { id: 'Received', label: 'Received' }
  ];

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
      title="Purchase Orders"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreateOrder={() => navigate('/purchase/orders/create')}
      onExport={() => console.log('Exporting POs...')}
      loading={loading}
      empty={orders.length === 0}
      emptyMessage="No purchase orders found."
      selectedCount={selectedOrders.length}
      totalCount={filteredOrders.length}
      onSelectAll={handleSelectAll}
      onDeleteSelected={handleDeleteSelected}
      onPrintSelected={() => window.print()}
      onUpdateSelected={() => console.log('Update selected', selectedOrders)}
      onDownloadSelected={() => console.log('Download selected', selectedOrders)}
    >
      {filteredOrders.length > 0 ? filteredOrders.map(po => (
        <OrderCard
          key={po.id}
          orderId={po.po_number || `PO-${po.id}`}
          isSelected={selectedOrders.includes(po.id)}
          onSelect={() => handleToggleSelect(po.id)}
          status={po.status_name}
          amount={formatCurrency(po.total_amount)}
          date={formatDate(po.order_date)}
          referenceLabel="Expected Delivery"
          referenceNo={formatDate(po.expected_delivery_date)}
          providerLogo="Supplier"
          actionOptions={[
            { value: po.status_name, label: po.status_name }
          ]}
          currentAction={po.status_name}
          items={[
            {
              name: po.supplier_name,
              sku: `Created By: ${po.created_by_name}`,
              quantity: 'N/A',
              icon: '🏢'
            }
          ]}
          onClick={() => navigate(`/purchase/orders/${po.id}`)}
          extraContent={{
            actions: (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/purchase/orders/${po.id}`);
                  }}
                  style={{ background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  View Details
                </button>
                {po.status_name === 'Draft' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // edit logic
                    }}
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', marginLeft: '0.5rem' }}
                  >
                    Edit
                  </button>
                )}
              </>
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

export default PurchaseOrderList;
