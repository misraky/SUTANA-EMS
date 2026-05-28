const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const UPLOAD_DIRS = {
  orders: 'uploads/orders',
  receipts: 'uploads/receipts',
  taxDocuments: 'uploads/tax-documents',
  expenses: 'uploads/expenses',
  products: 'uploads/products',
  profile: 'uploads/profile',
  temp: 'uploads/temp'
};
Object.values(UPLOAD_DIRS).forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});
const generateFilename = (originalname, prefix = '') => {
  const extension = path.extname(originalname);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  const filename = `${prefix}${timestamp}-${uuid}${extension}`;
  return filename;
};
/**
 * File filter for allowed types
 * @param {Object} req - Express request object
 * @param {Object} file - File object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedFileTypes;
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400), false);
  }
};
/**
 * Create storage configuration for specific upload type
 * @param {string} uploadType - Type of upload (orders, receipts, etc.)
 * @returns {Object} - Multer storage configuration
 */
const createStorage = (uploadType) => {
  const uploadPath = UPLOAD_DIRS[uploadType] || UPLOAD_DIRS.temp;
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), uploadPath));
    },
    filename: (req, file, cb) => {
      const prefix = req.user?.id ? `${req.user.id}_` : '';
      const filename = generateFilename(file.originalname, prefix);
      cb(null, filename);
    }
  });
};
/**
 * Create multer instance for single file upload
 * @param {string} uploadType - Type of upload
 * @param {number} maxSize - Max file size in bytes
 * @returns {Object} - Multer instance
 */
const createUploader = (uploadType, maxSize = null) => {
  const maxFileSize = maxSize || config.upload.maxFileSizeBytes;
  return multer({
    storage: createStorage(uploadType),
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: 1
    }
  });
};
/**
 * Create multer instance for multiple file upload
 * @param {string} uploadType - Type of upload
 * @param {number} maxCount - Maximum number of files
 * @param {number} maxSize - Max file size in bytes
 * @returns {Object} - Multer instance
 */
const createMultipleUploader = (uploadType, maxCount = 10, maxSize = null) => {
  const maxFileSize = maxSize || config.upload.maxFileSizeBytes;
  return multer({
    storage: createStorage(uploadType),
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxCount
    }
  });
};
// Pre-configured uploaders
const uploads = {
  // Single file uploads
  singleOrderAttachment: createUploader('orders'),
  singleTaxDocument: createUploader('taxDocuments'),
  singleExpenseReceipt: createUploader('expenses'),
  singleProductImage: createUploader('products'),
  singleProfilePicture: createUploader('profile'),
  multipleOrderAttachments: createMultipleUploader('orders', 10),
  multipleProductImages: createMultipleUploader('products', 5),
  multipleExpenseReceipts: createMultipleUploader('expenses', 3),
  generic: multer({
    storage: createStorage('temp'),
    fileFilter: fileFilter,
    limits: {
      fileSize: config.upload.maxFileSizeBytes
    }
  })
};
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: `File too large. Max size: ${config.upload.maxFileSizeBytes / (1024 * 1024)}MB`,
        code: 400
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files uploaded',
        code: 400
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Unexpected field name for file upload',
        code: 400
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message,
      code: 400
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'File upload failed',
      code: 400
    });
  }
  next();
};
const getFileInfo = (file) => {
  if (!file) return null;
  return {
    id: uuidv4(),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    path: file.path,
    url: `/uploads/${file.filename}`,
    uploadedAt: new Date().toISOString()
  };
};
const getMultipleFilesInfo = (files) => {
  if (!files || files.length === 0) return [];
  return files.map(file => getFileInfo(file));
};
const deleteFile = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error.message);
    return false;
  }
};
const deleteMultipleFiles = (filePaths) => {
  const results = {
    success: [],
    failed: []
  };
  for (const filePath of filePaths) {
    const deleted = deleteFile(filePath);
    if (deleted) {
      results.success.push(filePath);
    } else {
      results.failed.push(filePath);
    }
  }
  return results;
};
const cleanupTempFiles = () => {
  const tempDir = path.join(process.cwd(), UPLOAD_DIRS.temp);
  if (!fs.existsSync(tempDir)) return;
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; 
  let deletedCount = 0;
  for (const file of files) {
    const filePath = path.join(tempDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error.message);
    }
  }
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} temporary files`);
  }
};
if (!config.isTest) {
  setInterval(cleanupTempFiles, 60 * 60 * 1000);
}
module.exports = {
  uploads,
  handleUploadError,
  getFileInfo,
  getMultipleFilesInfo,
  deleteFile,
  deleteMultipleFiles,
  cleanupTempFiles,
  UPLOAD_DIRS,
  generateFilename
};
