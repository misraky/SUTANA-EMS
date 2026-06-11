const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('./env');
const uploadDirs = {
  orders: './uploads/orders',
  receipts: './uploads/receipts',
  taxDocuments: './uploads/tax-documents',
  expenses: './uploads/expenses',
  products: './uploads/products',
  cars: './uploads/cars',
  profile: './uploads/profile',
  temp: './uploads/temp'
};
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.fileUpload.allowedFileTypes;
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};
const generateFilename = (originalname, prefix = '') => {
  const extension = path.extname(originalname);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  const filename = `${prefix}${timestamp}-${uuid}${extension}`;
  return filename;
};
// Storage configuration for different upload types
const createStorage = (uploadType) => {
  const uploadPath = uploadDirs[uploadType] || uploadDirs.temp;
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const prefix = req.user?.id ? `${req.user.id}_` : '';
      const filename = generateFilename(file.originalname, prefix);
      cb(null, filename);
    }
  });
};
// Multer configuration for single file upload
const createUploader = (uploadType, maxSize = null) => {
  const maxFileSize = maxSize || (config.fileUpload.maxFileSizeMB * 1024 * 1024);
  return multer({
    storage: createStorage(uploadType),
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: 1
    }
  });
};
// Multer configuration for multiple file upload
const createMultipleUploader = (uploadType, maxCount = 10, maxSize = null) => {
  const maxFileSize = maxSize || (config.fileUpload.maxFileSizeMB * 1024 * 1024);
  return multer({
    storage: createStorage(uploadType),
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxCount
    }
  });
};
// Specific upload configurations
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
  carImages: multer({
    storage: createStorage('cars'),
    fileFilter: fileFilter,
    limits: {
      fileSize: config.fileUpload.maxFileSizeMB * 1024 * 1024
    }
  }),
  generic: multer({
    storage: createStorage('temp'),
    fileFilter: fileFilter,
    limits: {
      fileSize: config.fileUpload.maxFileSizeMB * 1024 * 1024
    }
  })
};
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: `File too large. Max size: ${config.fileUpload.maxFileSizeMB}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files uploaded'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Unexpected field name'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  next();
};
const getFileInfo = (file) => {
  if (!file) return null;
  return {
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
    console.error(`Error deleting file ${filePath}:`, error.message);
    return false;
  }
};
const cleanupTempFiles = () => {
  const tempDir = uploadDirs.temp;
  if (!fs.existsSync(tempDir)) return;
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; 
  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temp file: ${file}`);
    }
  });
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
  cleanupTempFiles,
  uploadDirs
};
