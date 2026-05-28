const compression = require('compression');
const zlib = require('zlib');
const config = require('../../config/env');
const compressionOptions = {
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: config.isProduction ? 6 : 3,
  threshold: config.isProduction ? 1024 : 2048, 
  memLevel: config.isProduction ? 8 : 6,
  strategy: zlib.constants.Z_DEFAULT_STRATEGY,
  chunkSize: 16384, 
  windowBits: 15
};
const brotliOptions = {
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: config.isProduction ? 6 : 4,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0
  }
};
const createCompression = (options = {}) => {
  const finalOptions = { ...compressionOptions, ...options };
  return compression(finalOptions);
};
const intelligentCompression = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  // Check if client accepts Brotli (better compression)
  if (acceptEncoding.includes('br') && !config.isDevelopment) {
    res.setHeader('Content-Encoding', 'br');
    const brotli = zlib.createBrotliCompress(brotliOptions);
    const originalSend = res.send;
    res.send = function(body) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        brotli.end(body);
        brotli.on('data', (chunk) => {
          res.write(chunk);
        });
        brotli.on('end', () => {
          res.end();
        });
        return this;
      }
      return originalSend.call(this, body);
    };
    next();
  } else {
    compression(compressionOptions)(req, res, next);
  }
};
const skipCompression = (paths) => {
  return (req, res, next) => {
    if (paths.includes(req.path)) {
      req.headers['x-no-compression'] = 'true';
    }
    next();
  };
};
const noCompressionPaths = [
  '/health',
  '/api/v1/health',
  '/api/v1/ping',
  '/api-docs',
  '/api-docs.json',
  '/swagger.yaml'
];
const compressionMiddleware = (req, res, next) => {
  if (noCompressionPaths.includes(req.path)) {
    return next();
  }
  compression(compressionOptions)(req, res, next);
};
const getCompressionStats = () => {
  return {
    enabled: true,
    level: compressionOptions.level,
    threshold: compressionOptions.threshold,
    algorithm: 'gzip',
    brotliSupported: true,
    routesExcluded: noCompressionPaths
  };
};
module.exports = {
  compressionMiddleware,
  createCompression,
  intelligentCompression,
  skipCompression,
  getCompressionStats,
  compressionOptions,
  noCompressionPaths
};
