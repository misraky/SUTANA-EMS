const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { logger } = require('../config/logger');
const PDF_CONFIG = {
  margin: 50,
  fontSize: {
    title: 20,
    header: 14,
    normal: 10,
    small: 8
  },
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#333333',
    lightText: '#666666',
    border: '#e5e7eb'
  }
};
const generateReceiptPDF = async (receiptData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PDF_CONFIG.margin, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(PDF_CONFIG.fontSize.title)
        .fillColor(PDF_CONFIG.colors.primary)
        .text('SUTANA EMS', { align: 'center' });
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text('Enterprise Management System', { align: 'center' })
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.header)
        .fillColor(PDF_CONFIG.colors.text)
        .text('TAX INVOICE / RECEIPT', { align: 'center' })
        .moveDown();
      doc.strokeColor(PDF_CONFIG.colors.border)
        .lineWidth(1)
        .moveTo(PDF_CONFIG.margin, doc.y)
        .lineTo(doc.page.width - PDF_CONFIG.margin, doc.y)
        .stroke()
        .moveDown(0.5);
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.text);
      doc.text(`Invoice Number: ${receiptData.invoiceNumber}`, { continued: true })
        .text(`Date: ${new Date(receiptData.date).toLocaleString()}`, { align: 'right' });
      doc.text(`Customer: ${receiptData.customer || 'Walk-in Customer'}`)
        .text(`Cashier: ${receiptData.cashier || 'N/A'}`)
        .moveDown();
      const tableTop = doc.y;
      const colPositions = {
        item: PDF_CONFIG.margin,
        qty: doc.page.width - PDF_CONFIG.margin - 200,
        price: doc.page.width - PDF_CONFIG.margin - 130,
        total: doc.page.width - PDF_CONFIG.margin - 50
      };
      doc.font('Helvetica-Bold')
        .fillColor(PDF_CONFIG.colors.primary)
        .text('Item', colPositions.item, tableTop)
        .text('Qty', colPositions.qty, tableTop)
        .text('Price', colPositions.price, tableTop)
        .text('Total', colPositions.total, tableTop);
      doc.strokeColor(PDF_CONFIG.colors.border)
        .lineWidth(0.5)
        .moveTo(PDF_CONFIG.margin, doc.y + 5)
        .lineTo(doc.page.width - PDF_CONFIG.margin, doc.y + 5)
        .stroke();
      let y = doc.y + 15;
      doc.font('Helvetica')
        .fillColor(PDF_CONFIG.colors.text);
      for (const item of receiptData.items) {
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = PDF_CONFIG.margin;
        }
        doc.text(item.product_name || item.name, colPositions.item, y)
          .text(item.quantity.toString(), colPositions.qty, y)
          .text(`${parseFloat(item.unit_price || item.price).toFixed(2)} ETB`, colPositions.price, y)
          .text(`${parseFloat(item.total).toFixed(2)} ETB`, colPositions.total, y);
        y += 20;
      }
      doc.moveTo(PDF_CONFIG.margin, y)
        .lineTo(doc.page.width - PDF_CONFIG.margin, y)
        .stroke();
      y += 15;
      doc.font('Helvetica-Bold');
      doc.text(`Subtotal: ${receiptData.subtotal.toFixed(2)} ETB`, 
        doc.page.width - PDF_CONFIG.margin - 150, y, { align: 'right' });
      y += 20;
      doc.text(`Discount: ${receiptData.discount.toFixed(2)} ETB`, 
        doc.page.width - PDF_CONFIG.margin - 150, y, { align: 'right' });
      y += 20;
      doc.text(`Tax (15%): ${receiptData.tax.toFixed(2)} ETB`, 
        doc.page.width - PDF_CONFIG.margin - 150, y, { align: 'right' });
      y += 20;
      doc.fontSize(PDF_CONFIG.fontSize.header)
        .fillColor(PDF_CONFIG.colors.success)
        .text(`TOTAL: ${receiptData.total.toFixed(2)} ETB`, 
          doc.page.width - PDF_CONFIG.margin - 150, y, { align: 'right' });
      y += 30;
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.text);
      doc.text(`Payment Method: ${receiptData.paymentMethod}`)
        .text(`Amount Paid: ${receiptData.amountPaid.toFixed(2)} ETB`)
        .text(`Change: ${receiptData.change.toFixed(2)} ETB`)
        .moveDown(2);
      doc.fontSize(PDF_CONFIG.fontSize.small)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text('Thank you for your business!', { align: 'center' })
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.end();
    } catch (error) {
      logger.error('PDF generation failed:', error.message);
      reject(error);
    }
  });
};
const generateInvoicePDF = async (invoiceData) => {
  return generateReceiptPDF(invoiceData);
};
const generateMonthlyReportPDF = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PDF_CONFIG.margin, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(PDF_CONFIG.fontSize.title)
        .fillColor(PDF_CONFIG.colors.primary)
        .text('SUTANA EMS', { align: 'center' });
      doc.fontSize(PDF_CONFIG.fontSize.header)
        .fillColor(PDF_CONFIG.colors.text)
        .text('MONTHLY EXECUTIVE REPORT', { align: 'center' })
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text(`Period: ${reportData.period?.startDate} to ${reportData.period?.endDate}`, { align: 'center' })
        .moveDown();
      doc.strokeColor(PDF_CONFIG.colors.border)
        .lineWidth(1)
        .moveTo(PDF_CONFIG.margin, doc.y)
        .lineTo(doc.page.width - PDF_CONFIG.margin, doc.y)
        .stroke()
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.header)
        .fillColor(PDF_CONFIG.colors.primary)
        .text('Executive Summary', { underline: true })
        .moveDown(0.5);
      const summary = reportData.summary || {};
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.text);
      doc.text(`Total Revenue: ${summary.totalRevenue?.toLocaleString() || 0} ETB`);
      doc.text(`Net Profit: ${summary.netProfit?.toLocaleString() || 0} ETB`);
      doc.text(`Profit Margin: ${summary.profitMargin || 0}%`);
      doc.text(`Total Orders: ${summary.totalOrders || 0}`);
      doc.text(`New Customers: ${summary.newCustomers || 0}`);
      doc.text(`Average Order Value: ${summary.avgOrderValue?.toLocaleString() || 0} ETB`);
      doc.moveDown();
      if (reportData.topProducts && reportData.topProducts.length > 0) {
        doc.fontSize(PDF_CONFIG.fontSize.header)
          .fillColor(PDF_CONFIG.colors.primary)
          .text('Top Products', { underline: true })
          .moveDown(0.5);
        for (const product of reportData.topProducts) {
          doc.fontSize(PDF_CONFIG.fontSize.normal)
            .text(`${product.name}: ${product.quantity} units - ${product.revenue.toLocaleString()} ETB`);
        }
        doc.moveDown();
      }
      if (reportData.monthlyTrend && reportData.monthlyTrend.length > 0) {
        doc.fontSize(PDF_CONFIG.fontSize.header)
          .fillColor(PDF_CONFIG.colors.primary)
          .text('Monthly Trend', { underline: true })
          .moveDown(0.5);
        for (const trend of reportData.monthlyTrend) {
          doc.text(`${trend.month}: ${trend.revenue.toLocaleString()} ETB`);
        }
      }
      doc.moveDown(2);
      doc.fontSize(PDF_CONFIG.fontSize.small)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text('Confidential - Executive Use Only', { align: 'center' })
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.end();
    } catch (error) {
      logger.error('Monthly report PDF generation failed:', error.message);
      reject(error);
    }
  });
};
const generateOrderConfirmationPDF = async (orderData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PDF_CONFIG.margin, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(PDF_CONFIG.fontSize.title)
        .fillColor(PDF_CONFIG.colors.primary)
        .text('SUTANA EMS', { align: 'center' });
      doc.fontSize(PDF_CONFIG.fontSize.header)
        .fillColor(PDF_CONFIG.colors.text)
        .text('ORDER CONFIRMATION', { align: 'center' })
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text(`Order Number: ${orderData.orderNumber}`, { align: 'center' })
        .text(`Date: ${new Date(orderData.createdAt).toLocaleString()}`, { align: 'center' })
        .moveDown();
      doc.strokeColor(PDF_CONFIG.colors.border)
        .lineWidth(1)
        .moveTo(PDF_CONFIG.margin, doc.y)
        .lineTo(doc.page.width - PDF_CONFIG.margin, doc.y)
        .stroke()
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.header)
        .fillColor(PDF_CONFIG.colors.primary)
        .text('Customer Information', { underline: true })
        .moveDown(0.5);
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.text)
        .text(`Name: ${orderData.customerName}`)
        .text(`Phone: ${orderData.customerPhone || 'N/A'}`)
        .text(`Email: ${orderData.customerEmail || 'N/A'}`)
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.header)
        .fillColor(PDF_CONFIG.colors.primary)
        .text('Order Details', { underline: true })
        .moveDown(0.5);
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .text(`Product Type: ${orderData.productType}`)
        .text(`Quantity: ${orderData.quantity}`)
        .text(`Paper Type: ${orderData.paperType}`)
        .text(`Pages per Copy: ${orderData.pagesPerCopy}`)
        .text(`Binding: ${orderData.bindingType || 'None'}`)
        .text(`Due Date: ${orderData.dueDate}`)
        .text(`Total Price: ${orderData.totalPrice} ETB`)
        .moveDown();
      if (orderData.specialInstructions) {
        doc.text(`Special Instructions: ${orderData.specialInstructions}`);
      }
      doc.moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.small)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text('Thank you for your order!', { align: 'center' })
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.end();
    } catch (error) {
      logger.error('Order confirmation PDF generation failed:', error.message);
      reject(error);
    }
  });
};
const generateTaxReceiptPDF = async (receiptData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PDF_CONFIG.margin, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(PDF_CONFIG.fontSize.title)
        .fillColor(PDF_CONFIG.colors.error)
        .text('GOVERNMENT TAX RECEIPT', { align: 'center' });
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text(`Serial Number: ${receiptData.serialNumber}`, { align: 'center' })
        .moveDown();
      doc.strokeColor(PDF_CONFIG.colors.border)
        .lineWidth(1)
        .moveTo(PDF_CONFIG.margin, doc.y)
        .lineTo(doc.page.width - PDF_CONFIG.margin, doc.y)
        .stroke()
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.normal)
        .fillColor(PDF_CONFIG.colors.text)
        .text(`Order Number: ${receiptData.orderNumber}`)
        .text(`Customer Name: ${receiptData.customerName}`)
        .text(`Customer Type: ${receiptData.customerType}`)
        .text(`Approval Amount: ${receiptData.approvalAmountTotal}`)
        .text(`Used Count: ${receiptData.usedCount}`)
        .text(`Remaining: ${receiptData.remaining}`)
        .text(`Approved Date: ${receiptData.approvedDate}`)
        .text(`Printed At: ${new Date(receiptData.printedAt).toLocaleString()}`)
        .text(`Printed By: ${receiptData.printedBy}`)
        .moveDown();
      doc.fontSize(PDF_CONFIG.fontSize.small)
        .fillColor(PDF_CONFIG.colors.lightText)
        .text('Official Government Tax Receipt', { align: 'center' })
        .text('This is a computer-generated document. No signature required.', { align: 'center' });
      doc.end();
    } catch (error) {
      logger.error('Tax receipt PDF generation failed:', error.message);
      reject(error);
    }
  });
};
const savePDFToFile = async (pdfBuffer, filename, outputDir = './uploads/pdfs') => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, filename);
    fs.writeFile(filePath, pdfBuffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
};
const getPDFAsBase64 = (pdfBuffer) => {
  return pdfBuffer.toString('base64');
};
const getPDFAsDataURL = (pdfBuffer) => {
  return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
};
module.exports = {
  generateReceiptPDF,
  generateInvoicePDF,
  generateMonthlyReportPDF,
  generateOrderConfirmationPDF,
  generateTaxReceiptPDF,
  savePDFToFile,
  getPDFAsBase64,
  getPDFAsDataURL,
  PDF_CONFIG
};
