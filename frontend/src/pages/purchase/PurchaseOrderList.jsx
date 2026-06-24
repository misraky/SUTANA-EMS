import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import OrdersLayout from '../../components/orders/OrdersLayout';
import OrderCard from '../../components/orders/OrderCard';
import styles from './PurchaseOrderList.module.css';

const CANCELABLE = ['Draft', 'Pending', 'Pending Approval', 'Approved'];

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
  const handleCancel = async (po, e) => {
    e.stopPropagation();
    if (!window.confirm(`Cancel ${po.po_number}? This cannot be undone.`)) return;
    try {
      await purchaseService.cancelPO(po.id, { reason: 'Cancelled by user' });
      setOrders(prev => prev.map(o => o.id === po.id ? { ...o, status_name: 'Cancelled' } : o));
    } catch (error) {
      alert('Failed to cancel: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className={styles.loading}>Loading purchase orders...</div>;

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
        <button className={styles.btnPrimary} onClick={() => navigate('/purchase/orders/create')}>
          New Purchase Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>
          <div style={{fontSize:40,marginBottom:12}}>&#128230;</div>
          <p>No purchase orders yet. Click <strong>New Purchase Order</strong> to create one.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Expected</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id}>
                  <td className={styles.poNumber}>{po.po_number}</td>
                  <td><strong className={styles.supplierName}>{po.supplier_name}</strong></td>
                  <td>{formatDate(po.order_date)}</td>
                  <td>{formatDate(po.expected_delivery_date)}</td>
                  <td>{formatCurrency(po.total_amount)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[po.status_name ? po.status_name.toLowerCase().replace(' ', '') : ''] || styles.defaultBadge}`}>
                      {po.status_name}
                    </span>
                  </td>
                  <td className={styles.textSm}>{po.created_by_name}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.btnIcon} title="View Details" onClick={() => navigate(`/purchase/orders/${po.id}`)}>
                        &#128065;
                      </button>
                      {po.status_name === 'Draft' && (
                        <button className={styles.btnIcon} title="Edit" onClick={() => navigate(`/purchase/orders/create`, { state: { editPO: po.id } })}>
                          &#9998;
                        </button>
                      )}
                      {CANCELABLE.includes(po.status_name) && (
                        <button className={styles.btnIcon} title="Cancel" onClick={(e) => handleCancel(po, e)} style={{color:'#dc2626'}}>
                          &#10005;
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderList;
