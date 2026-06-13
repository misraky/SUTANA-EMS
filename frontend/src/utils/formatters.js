export const formatCurrency = (amount, currency = 'ETB') => {
  if (amount === undefined || amount === null) return '0.00 ' + currency;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + currency;
};
export const formatNumber = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('en-US').format(number);
};
export const formatPercentage = (value) => {
  if (value === undefined || value === null) return '0%';
  return `${value}%`;
};
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  if (phone.startsWith('09')) {
    return `+251 ${phone.substring(1, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
  }
  return phone;
};
export const truncateString = (str, length = 20) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};
export const formatDate = (dateString, format = 'long') => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  if (format === 'short') {
    return date.toLocaleDateString('en-US');
  } else if (format === 'time') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (format === 'datetime') {
    return date.toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};
