const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const convertToCSV = (data, options = {}) => {
  if (!data || data.length === 0) return '';
  const defaultOptions = {
    fields: Object.keys(data[0]),
    delimiter: ',',
    quote: '"',
    header: true
  };
  const parser = new Parser({ ...defaultOptions, ...options });
  return parser.parse(data);
};
/**
 * Convert data to Excel workbook
 * @param {Array} data - Array of objects to convert
 * @param {string} sheetName - Name of the sheet
 * @param {Object} options - Excel options
 * @returns {Promise<ExcelJS.Workbook>} - Excel workbook
 */
const convertToExcel = async (data, sheetName = 'Sheet1', options = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  if (!data || data.length === 0) {
    return workbook;
  }
  const columns = Object.keys(data[0]);
  worksheet.columns = columns.map(col => ({
    header: formatColumnHeader(col),
    key: col,
    width: options.columnWidth || 20
  }));
  data.forEach(row => {
    worksheet.addRow(row);
  });
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  worksheet.getRow(1).alignment = { horizontal: 'center' };
  worksheet.autoFilter = {
    from: 'A1',
    to: `${String.fromCharCode(64 + columns.length)}${data.length + 1}`
  };
  return workbook;
};
const convertToPDF = (data, options = {}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    const title = options.title || 'Export Report';
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    if (!data || data.length === 0) {
      doc.text('No data available');
      doc.end();
      return;
    }
    const columns = Object.keys(data[0]);
    const colWidth = (doc.page.width - 100) / columns.length;
    let y = doc.y + 10;
    doc.font('Helvetica-Bold');
    columns.forEach((col, i) => {
      doc.text(formatColumnHeader(col), 50 + (i * colWidth), y, { width: colWidth, align: 'left' });
    });
    y += 20;
    doc.font('Helvetica');
    for (const row of data) {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
        doc.font('Helvetica-Bold');
        columns.forEach((col, i) => {
          doc.text(formatColumnHeader(col), 50 + (i * colWidth), y, { width: colWidth, align: 'left' });
        });
        y += 20;
        doc.font('Helvetica');
      }
      columns.forEach((col, i) => {
        let value = row[col];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'number') value = value.toLocaleString();
        if (value instanceof Date) value = value.toLocaleDateString();
        doc.text(String(value), 50 + (i * colWidth), y, { width: colWidth, align: 'left' });
      });
      y += 20;
    }
    doc.end();
  });
};
const formatColumnHeader = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
};
const exportToFile = async (data, format, filename, outputDir = './exports') => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  let filePath;
  let buffer;
  switch (format) {
    case 'csv':
      filePath = path.join(outputDir, `${filename}.csv`);
      const csv = convertToCSV(data);
      fs.writeFileSync(filePath, csv);
      break;
    case 'excel':
      filePath = path.join(outputDir, `${filename}.xlsx`);
      const workbook = await convertToExcel(data, filename);
      await workbook.xlsx.writeFile(filePath);
      break;
    case 'pdf':
      filePath = path.join(outputDir, `${filename}.pdf`);
      buffer = await convertToPDF(data, { title: filename });
      fs.writeFileSync(filePath, buffer);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  return filePath;
};
const exportToBuffer = async (data, format, sheetName = 'Export') => {
  switch (format) {
    case 'csv':
      return Buffer.from(convertToCSV(data), 'utf8');
    case 'excel':
      const workbook = await convertToExcel(data, sheetName);
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    case 'pdf':
      return await convertToPDF(data, { title: sheetName });
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};
const getExportContentType = (format) => {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};
const getExportExtension = (format) => {
  switch (format) {
    case 'csv':
      return '.csv';
    case 'excel':
      return '.xlsx';
    case 'pdf':
      return '.pdf';
    default:
      return '.txt';
  }
};
const cleanupOldExports = (outputDir = './exports', hoursOld = 24) => {
  if (!fs.existsSync(outputDir)) return 0;
  const now = Date.now();
  const maxAge = hoursOld * 60 * 60 * 1000;
  let deleted = 0;
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  }
  return deleted;
};
const prepareDataForExport = (data) => {
  if (!data || data.length === 0) return [];
  return data.map(row => {
    const formattedRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined) {
        formattedRow[key] = '';
      } else if (typeof value === 'number') {
        formattedRow[key] = value.toLocaleString();
      } else if (value instanceof Date) {
        formattedRow[key] = value.toLocaleDateString();
      } else if (typeof value === 'object') {
        formattedRow[key] = JSON.stringify(value);
      } else {
        formattedRow[key] = String(value);
      }
    }
    return formattedRow;
  });
};
const chunkData = (data, chunkSize = 10000) => {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
};
module.exports = {
  convertToCSV,
  convertToExcel,
  convertToPDF,
  formatColumnHeader,
  exportToFile,
  exportToBuffer,
  getExportContentType,
  getExportExtension,
  cleanupOldExports,
  prepareDataForExport,
  chunkData
};
