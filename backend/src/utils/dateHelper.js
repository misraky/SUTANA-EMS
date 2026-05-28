const moment = require('moment');
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm:ss',
  TIME: 'HH:mm:ss',
  TIME_12H: 'hh:mm A',
  MONTH_DAY: 'MMM DD',
  MONTH_YEAR: 'MMM YYYY',
  YEAR: 'YYYY',
  FULL_DATETIME: 'YYYY-MM-DD HH:mm:ss',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  FILENAME: 'YYYY-MM-DD_HH-mm-ss'
};
const TIMEZONE = 'Africa/Addis_Ababa';
const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  const momentDate = moment(date);
  if (!momentDate.isValid()) return '';
  return momentDate.format(format);
};
/**
 * Format date for API response
 * @param {Date|string} date - Date to format
 * @returns {string|null} - ISO formatted date or null
 */
const formatApiDate = (date) => {
  if (!date) return null;
  const momentDate = moment(date);
  if (!momentDate.isValid()) return null;
  return momentDate.format(DATE_FORMATS.API);
};
/**
 * Format date for filename
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string for filename
 */
const formatForFilename = (date = new Date()) => {
  return moment(date).format(DATE_FORMATS.FILENAME);
};
/**
 * Get current date in Ethiopia timezone
 * @param {string} format - Desired format
 * @returns {string} - Current date formatted
 */
const getCurrentDate = (format = DATE_FORMATS.ISO) => {
  return moment().tz(TIMEZONE).format(format);
};
/**
 * Get current timestamp
 * @returns {string} - Current timestamp in ISO format
 */
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};
/**
 * Add days to a date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
const addDays = (date, days) => {
  const momentDate = moment(date);
  return momentDate.add(days, 'days').toDate();
};
const subtractDays = (date, days) => {
  const momentDate = moment(date);
  return momentDate.subtract(days, 'days').toDate();
};
const addMonths = (date, months) => {
  const momentDate = moment(date);
  return momentDate.add(months, 'months').toDate();
};
const subtractMonths = (date, months) => {
  const momentDate = moment(date);
  return momentDate.subtract(months, 'months').toDate();
};
const daysDifference = (date1, date2) => {
  const momentDate1 = moment(date1);
  const momentDate2 = moment(date2);
  return momentDate2.diff(momentDate1, 'days');
};
const hoursDifference = (date1, date2) => {
  const momentDate1 = moment(date1);
  const momentDate2 = moment(date2);
  return momentDate2.diff(momentDate1, 'hours');
};
const isToday = (date) => {
  return moment(date).isSame(moment(), 'day');
};
const isYesterday = (date) => {
  return moment(date).isSame(moment().subtract(1, 'days'), 'day');
};
const isPast = (date) => {
  return moment(date).isBefore(moment());
};
const isFuture = (date) => {
  return moment(date).isAfter(moment());
};
const startOfDay = (date = new Date()) => {
  return moment(date).startOf('day').toDate();
};
const endOfDay = (date = new Date()) => {
  return moment(date).endOf('day').toDate();
};
const startOfWeek = (date = new Date()) => {
  return moment(date).startOf('isoWeek').toDate();
};
const endOfWeek = (date = new Date()) => {
  return moment(date).endOf('isoWeek').toDate();
};
const startOfMonth = (date = new Date()) => {
  return moment(date).startOf('month').toDate();
};
const endOfMonth = (date = new Date()) => {
  return moment(date).endOf('month').toDate();
};
const startOfYear = (date = new Date()) => {
  return moment(date).startOf('year').toDate();
};
const endOfYear = (date = new Date()) => {
  return moment(date).endOf('year').toDate();
};
const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;
  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case 'yesterday':
      startDate = startOfDay(subtractDays(now, 1));
      endDate = endOfDay(subtractDays(now, 1));
      break;
    case 'week':
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }
    case 'year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    default:
      startDate = startOfDay(now);
      endDate = endOfDay(now);
  }
  return { startDate, endDate };
};
const getPreviousDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;
  switch (period) {
    case 'today':
      startDate = startOfDay(subtractDays(now, 1));
      endDate = endOfDay(subtractDays(now, 1));
      break;
    case 'week':
      startDate = startOfWeek(subtractDays(now, 7));
      endDate = endOfWeek(subtractDays(now, 7));
      break;
    case 'month': {
      const lastMonth = subtractMonths(now, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      break;
    }
    case 'quarter': {
      const lastQuarter = subtractMonths(now, 3);
      const quarterStartMonth = Math.floor(lastQuarter.getMonth() / 3) * 3;
      startDate = new Date(lastQuarter.getFullYear(), quarterStartMonth, 1);
      endDate = new Date(lastQuarter.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }
    case 'year':
      startDate = startOfYear(subtractMonths(now, 12));
      endDate = endOfYear(subtractMonths(now, 12));
      break;
    default:
      startDate = startOfDay(subtractDays(now, 1));
      endDate = endOfDay(subtractDays(now, 1));
  }
  return { startDate, endDate };
};
const formatRelativeTime = (date) => {
  const momentDate = moment(date);
  if (!momentDate.isValid()) return '';
  return momentDate.fromNow();
};
/**
 * Format time ago (e.g., "2 days ago")
 * @param {Date|string} date - Date to format
 * @returns {string} - Time ago string
 */
const timeAgo = (date) => {
  const momentDate = moment(date);
  if (!momentDate.isValid()) return '';
  return momentDate.fromNow();
};
/**
 * Get age from birth date
 * @param {Date|string} birthDate - Birth date
 * @returns {number} - Age in years
 */
const getAge = (birthDate) => {
  return moment().diff(moment(birthDate), 'years');
};
const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  const parsed = moment(dateString);
  return parsed.isValid() ? parsed.toDate() : null;
};
const isValidDate = (dateString, format = DATE_FORMATS.ISO) => {
  return moment(dateString, format, true).isValid();
};
const getEthiopianDate = (date = new Date()) => {
  const gregorian = moment(date);
  const ethiopianYear = gregorian.year() - 8;
  const ethiopianMonth = gregorian.month() + 1;
  const ethiopianDay = gregorian.date();
  const ethiopianMonths = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehasse', 'Pagumen'
  ];
  return {
    year: ethiopianYear,
    month: ethiopianMonth,
    monthName: ethiopianMonths[ethiopianMonth - 1] || 'Unknown',
    day: ethiopianDay,
    fullDate: `${ethiopianMonths[ethiopianMonth - 1]} ${ethiopianDay}, ${ethiopianYear} EC`
  };
};
const getBusinessDays = (startDate, endDate) => {
  let start = moment(startDate);
  const end = moment(endDate);
  let businessDays = 0;
  while (start <= end) {
    const dayOfWeek = start.day();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
      businessDays++;
    }
    start.add(1, 'day');
  }
  return businessDays;
};
const getWorkingHours = (startDate, endDate, workHours = { start: '09:00', end: '17:00' }) => {
  const start = moment(startDate);
  const end = moment(endDate);
  const workStart = moment(start).set('hour', parseInt(workHours.start.split(':')[0])).set('minute', parseInt(workHours.start.split(':')[1]));
  const workEnd = moment(start).set('hour', parseInt(workHours.end.split(':')[0])).set('minute', parseInt(workHours.end.split(':')[1]));
  let totalHours = 0;
  let current = moment(start);
  while (current < end) {
    const dayOfWeek = current.day();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dayStart = moment(current).set('hour', workStart.hour()).set('minute', workStart.minute());
      const dayEnd = moment(current).set('hour', workEnd.hour()).set('minute', workEnd.minute());
      const effectiveStart = moment.max(current, dayStart);
      const effectiveEnd = moment.min(end, dayEnd);
      if (effectiveStart < effectiveEnd) {
        totalHours += effectiveEnd.diff(effectiveStart, 'hours', true);
      }
    }
    current.add(1, 'day').startOf('day');
  }
  return Math.round(totalHours * 10) / 10;
};
module.exports = {
  DATE_FORMATS,
  TIMEZONE,
  formatDate,
  formatApiDate,
  formatForFilename,
  getCurrentDate,
  getCurrentTimestamp,
  addDays,
  subtractDays,
  addMonths,
  subtractMonths,
  daysDifference,
  hoursDifference,
  isToday,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getDateRange,
  getPreviousDateRange,
  formatRelativeTime,
  timeAgo,
  getAge,
  parseDateSafe,
  isValidDate,
  getEthiopianDate,
  getBusinessDays,
  getWorkingHours
};
