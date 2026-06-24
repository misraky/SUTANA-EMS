import React, { Children } from 'react';
import { Search, Download, Plus, Filter, Printer, Edit2, Trash2, MoreVertical } from 'lucide-react';
import styles from './OrdersLayout.module.css';

const OrdersLayout = ({
  title = "Orders",
  tabs = [],
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onCreateOrder,
  onExport,
  loading,
  empty,
  emptyMessage = "No orders found.",
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onPrintSelected,
  onUpdateSelected,
  onDownloadSelected,
  onDeleteSelected,
  onMoreSelected,
  children
}) => {
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const hasSelection = selectedCount > 0;

  return (
    <div className={styles.layoutContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={onExport}>
            <Download size={16} /> Export All
          </button>
          <button className={styles.createBtn} onClick={onCreateOrder}>
            <Plus size={16} /> Create Order
          </button>
        </div>
      </div>

      {tabs.length > 0 && (
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => {
            const statusClass = tab.id.toLowerCase().split(' ')[0];
            return (
              <div 
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''} ${styles[statusClass] || ''}`}
                onClick={() => onTabChange && onTabChange(tab.id)}
              >
                {tab.label}
                <span className={styles.tabBadge}>{tab.count || 0}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.searchFilterBar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search orders..." 
            value={searchTerm || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          <Filter size={16} /> Filters
        </button>
      </div>

      {hasSelection && (
        <div className={styles.batchActionsBar}>
          <div className={styles.selectAllWrap}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={isAllSelected}
              onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
            />
            {selectedCount} Selected
          </div>
          <button className={`${styles.batchBtn} ${styles.warning}`} onClick={onPrintSelected}>
            <Printer size={14} /> Print
          </button>
          <button className={`${styles.batchBtn} ${styles.success}`} onClick={onUpdateSelected}>
            <Edit2 size={14} /> Update Order
          </button>
          <button className={styles.batchBtnIconOnly} onClick={onDownloadSelected}>
            <Download size={16} />
          </button>
          <button className={`${styles.batchBtnIconOnly} ${styles.danger}`} onClick={onDeleteSelected}>
            <Trash2 size={16} />
          </button>
          <button className={styles.batchBtnIconOnly} onClick={onMoreSelected}>
            <MoreVertical size={16} />
          </button>
        </div>
      )}

      {!hasSelection && totalCount > 0 && (
        <div className={styles.batchActionsBar} style={{ background: 'transparent', border: 'none', padding: '0 0 1.5rem 0', boxShadow: 'none', animation: 'none' }}>
           <div className={styles.selectAllWrap} style={{ color: '#64748b', fontWeight: 500 }}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={false}
              onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
            />
            Select All
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingState}>Loading orders...</div>
      ) : empty ? (
        <div className={styles.emptyState}>
          <p>{emptyMessage}</p>
          <button className={styles.createBtn} onClick={onCreateOrder} style={{ margin: '0 auto' }}>
            Create First Order
          </button>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {children}
        </div>
      )}
    </div>
  );
};

export default OrdersLayout;
