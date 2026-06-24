import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import styles from './OrdersLayout.module.css';

const OrderCard = ({
  orderId,
  status,
  statusLabel,
  amount,
  date,
  referenceNo,
  referenceLabel = "Shipping No",
  items = [],
  actionOptions = [],
  currentAction,
  onActionChange,
  providerLogo,
  extraContent,
  onClick,
  isSelected,
  onSelect
}) => {
  const getStatusColor = (s) => {
    const lower = (s || '').toLowerCase();
    if (lower.includes('paid') || lower.includes('delivered') || lower.includes('ready') || lower.includes('completed') || lower.includes('received')) return 'paid';
    if (lower.includes('waiting') || lower.includes('unpaid')) return 'waiting';
    if (lower.includes('pending') || lower.includes('draft') || lower.includes('quality')) return 'pending';
    if (lower.includes('progress') || lower.includes('active') || lower.includes('confirmed')) return 'progress';
    if (lower.includes('cancel') || lower.includes('reject')) return 'canceled';
    return 'waiting';
  };

  const statusClass = getStatusColor(status);

  return (
    <div className={`${styles.orderCard} ${isSelected ? styles.selected : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <input 
            type="checkbox" 
            className={styles.checkbox} 
            checked={!!isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect && onSelect(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()} 
          />
          <div>
            <div className={styles.orderTitleInfo}>
              <h3 className={styles.orderTitle}>Order #{orderId}</h3>
              <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
                {statusLabel || status}
              </span>
            </div>
            
            <div className={styles.orderMeta}>
              <div className={styles.metaItem}>
                <Calendar size={14} />
                {date}
              </div>
              {referenceNo && (
                <>
                  <span className={styles.metaDivider}>|</span>
                  <div className={styles.metaItem}>
                    {referenceLabel}: <span style={{color: '#3b82f6'}}>{referenceNo}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={styles.cardHeaderRight}>
          {amount}
        </div>
      </div>

      <div className={styles.cardActions}>
        {actionOptions.length > 0 && (
          <select 
            className={styles.statusDropdown} 
            value={currentAction}
            onChange={(e) => {
              e.stopPropagation();
              onActionChange && onActionChange(e.target.value);
            }}
            onClick={e => e.stopPropagation()}
          >
            {actionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        
        {providerLogo && (
          <div className={styles.providerBadge}>
            <span style={{color: '#d97706'}}>📦</span> {providerLogo}
          </div>
        )}

        <div className={styles.cardActionsRight}>
          {/* We can inject custom action buttons via props if needed, but for now we keep the layout clean */}
          {extraContent?.actions}
        </div>
      </div>

      <div className={styles.cardBody}>
        {items.map((item, index) => (
          <div key={index} className={styles.orderItem}>
            {item.image ? (
              <img src={item.image} alt={item.name} className={styles.itemImage} />
            ) : (
              <div className={styles.itemImageFallback}>{item.icon || '📦'}</div>
            )}
            <div className={styles.itemDetails}>
              <h4 className={styles.itemName}>{item.name}</h4>
              {item.sku && <p className={styles.itemMeta}>SKU: <span style={{color: '#3b82f6'}}>{item.sku}</span></p>}
              {item.meta && item.meta.map((m, i) => (
                <p key={i} className={styles.itemMeta}>{m.label}: {m.value}</p>
              ))}
              <p className={styles.itemMeta}>Quantity: {item.quantity}</p>
            </div>
          </div>
        ))}
        {extraContent?.body}
      </div>
    </div>
  );
};

export default OrderCard;
