const helmet = require('helmet');
const config = require('../../config/env');
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", 
      "'unsafe-eval'",   
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://code.jquery.com'
    ].concat(config.isDevelopment ? ["'unsafe-eval'"] : []),
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
      'data:'
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https://',
      'http://',
      'https://api.qrserver.com'
    ],
    connectSrc: [
      "'self'",
      config.frontendUrl,
      'https://api.sendgrid.com',
      'https://api.africastalking.com',
      'https://sandbox.cbe.com.et',
      'https://sandbox.dashenbank.et',
      'https://sandbox.awashbank.com',
      'https://sandbox.telebirr.et'
    ],
    frameSrc: [
      "'self'",
      'https://telebirr.et'
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    formAction: [
      "'self'",
      'https://telebirr.et'
    ],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'"],
    upgradeInsecureRequests: config.isProduction
  },
  reportOnly: config.isDevelopment,
  reportUri: config.isProduction ? '/api/v1/csp-report' : null
};
const hstsConfig = {
  maxAge: 31536000, 
  includeSubDomains: true,
  preload: true
};
const xssProtectionConfig = {
  reportUri: '/api/v1/xss-report',
  mode: 'block'
};
const referrerPolicyConfig = {
  policy: 'strict-origin-when-cross-origin'
};
const permissionsPolicyConfig = {
  features: {
    geolocation: ["'none'"],
    microphone: ["'none'"],
    camera: ["'none'"],
    payment: ["'self'"],
    usb: ["'none'"],
    magnetometer: ["'none'"],
    accelerometer: ["'none'"],
    gyroscope: ["'none'"],
    speaker: ["'none'"],
    vibrate: ["'none'"],
    fullscreen: ["'self'"]
  }
};
const coepConfig = {
  policy: 'require-corp'
};
const coopConfig = {
  policy: 'same-origin'
};
const corpConfig = {
  policy: 'same-origin'
};
const helmetConfig = {
  contentSecurityPolicy: cspConfig,
  hsts: hstsConfig,
  xssFilter: xssProtectionConfig,
  noSniff: true,
  hidePoweredBy: true,
  ieNoOpen: true,
  referrerPolicy: referrerPolicyConfig,
  frameguard: {
    action: 'deny'
  },
  dnsPrefetchControl: {
    allow: false
  },
  expectCt: {
    maxAge: 86400,
    enforce: true,
    reportUri: config.isProduction ? '/api/v1/ct-report' : undefined
  },
  originAgentCluster: true
};
if (config.isProduction) {
  helmetConfig.permissionsPolicy = permissionsPolicyConfig;
}
const helmetMiddleware = () => {
  const helm = helmet();
  return (req, res, next) => {
    helm(req, res, (err) => {
      if (err) return next(err);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      const permPolicy = Object.entries(permissionsPolicyConfig.features)
        .map(([feature, allowlist]) => `${feature}=${allowlist.join(' ')}`)
        .join(', ');
      res.setHeader('Permissions-Policy', permPolicy);
      res.setHeader('Cross-Origin-Embedder-Policy', coepConfig.policy);
      res.setHeader('Cross-Origin-Opener-Policy', coopConfig.policy);
      res.setHeader('Cross-Origin-Resource-Policy', corpConfig.policy);
      res.removeHeader('X-Powered-By');
      next();
    });
  };
};
const handleCSPReport = (req, res) => {
  const report = req.body;
  console.warn('CSP Violation:', {
    'blocked-uri': report['csp-report']['blocked-uri'],
    'violated-directive': report['csp-report']['violated-directive'],
    'document-uri': report['csp-report']['document-uri']
  });
  res.status(204).end();
};
const handleXSSReport = (req, res) => {
  console.warn('XSS Attempt:', req.body);
  res.status(204).end();
};
const getSecurityHeaders = () => {
  return {
    'Strict-Transport-Security': `max-age=${hstsConfig.maxAge}; includeSubDomains; preload`,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Embedder-Policy': coepConfig.policy,
    'Cross-Origin-Opener-Policy': coopConfig.policy,
    'Cross-Origin-Resource-Policy': corpConfig.policy
  };
};
const securityHeadersMiddleware = (req, res, next) => {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
};
module.exports = {
  helmetMiddleware,
  handleCSPReport,
  handleXSSReport,
  getSecurityHeaders,
  securityHeadersMiddleware,
  cspConfig,
  hstsConfig
};
