import { format, formatDistance, formatRelative, subDays } from 'date-fns';
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  return format(new Date(date), formatStr);
};
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};
export const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};
