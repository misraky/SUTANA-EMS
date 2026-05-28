const { db } = require('../config/database');
const generateOrderNumber = async (prefix = 'PRT') => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  // Determine next sequence from DB
  const lastOrder = await db('printing_orders')
    .where('order_number', 'like', `${prefix}-${dateStr}-%`)
    .orderBy('order_number', 'desc')
    .first();
  let counter = 1;
  if (lastOrder) {
    const parts = lastOrder.order_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) counter = lastSeq + 1;
  }
  const sequence = counter.toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${sequence}`;
};
const generateInvoiceNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const lastInvoice = await db('pos_sales')
    .where('invoice_number', 'like', `INV-${dateStr}-%`)
    .orderBy('invoice_number', 'desc')
    .first();
  let counter = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoice_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) counter = lastSeq + 1;
  }
  const sequence = counter.toString().padStart(4, '0');
  return `INV-${dateStr}-${sequence}`;
};
const generatePONumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const lastOrder = await db('purchase_orders')
    .where('po_number', 'like', `PO-${dateStr}-%`)
    .orderBy('po_number', 'desc')
    .first();
  let counter = 1;
  if (lastOrder) {
    const parts = lastOrder.po_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) counter = lastSeq + 1;
  }
  const sequence = counter.toString().padStart(4, '0');
  return `PO-${dateStr}-${sequence}`;
};
const generateQuoteNumber = async () => {
  return generateOrderNumber('QT');
};
const generateReceiptNumber = async () => {
  return generateOrderNumber('RCP');
};
const generateTaxReceiptNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const lastReceipt = await db('tax_receipts')
    .where('serial_number', 'like', `TR-${dateStr}-%`)
    .orderBy('serial_number', 'desc')
    .first();
  let counter = 1;
  if (lastReceipt) {
    const parts = lastReceipt.serial_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) counter = lastSeq + 1;
  }
  const sequence = counter.toString().padStart(4, '0');
  return `TR-${dateStr}-${sequence}`;
};
const generatePaymentReference = async () => {
  return generateOrderNumber('PAY');
};
const generateBatchOrderNumbers = async (prefix = 'PRT', count = 1) => {
  const numbers = [];
  for (let i = 0; i < count; i++) {
    const number = await generateOrderNumber(prefix);
    numbers.push(number);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  return numbers;
};
const isValidOrderNumber = (orderNumber, prefix = null) => {
  const pattern = /^([A-Z]{2,3})-([0-9]{8})-([0-9]{4})$/;
  const match = orderNumber.match(pattern);
  if (!match) return false;
  if (prefix && match[1] !== prefix) return false;
  const dateStr = match[2];
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false;
  }
  return true;
};
const parseOrderNumber = (orderNumber) => {
  const pattern = /^([A-Z]{2,3})-([0-9]{8})-([0-9]{4})$/;
  const match = orderNumber.match(pattern);
  if (!match) return null;
  const prefix = match[1];
  const dateStr = match[2];
  const sequence = match[3];
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  return {
    prefix,
    date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    sequence: parseInt(sequence),
    year,
    month,
    day
  };
};
const getNextSequence = async (prefix, dateStr) => {
  const lastOrder = await db('printing_orders')
    .where('order_number', 'like', `${prefix}-${dateStr}-%`)
    .orderBy('order_number', 'desc')
    .first();
  let counter = 1;
  if (lastOrder) {
    const parts = lastOrder.order_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) counter = lastSeq + 1;
  }
  return counter;
};
const resetCounter = async (prefix, dateStr) => {
  const counterKey = `order_counter:${prefix}:${dateStr}`;
  return true;
};
module.exports = {
  generateOrderNumber,
  generateInvoiceNumber,
  generatePONumber,
  generateQuoteNumber,
  generateReceiptNumber,
  generateTaxReceiptNumber,
  generatePaymentReference,
  generateBatchOrderNumbers,
  isValidOrderNumber,
  parseOrderNumber,
  getNextSequence,
  resetCounter
};
