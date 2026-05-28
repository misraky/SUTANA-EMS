const {
  formatCurrency,
  formatEthiopianPhone,
  formatFileSize,
  truncate,
  toSlug
} = require('../../src/utils/formatters');

describe('Formatters Utility tests', () => {
  describe('formatCurrency', () => {
    it('should format numbers to ETB currency representation', () => {
      expect(formatCurrency(1250)).toBe('1,250.00 ETB');
      expect(formatCurrency(0)).toBe('0.00 ETB');
      expect(formatCurrency('250.5')).toBe('250.50 ETB');
    });

    it('should handle null/undefined/invalid values gracefully', () => {
      expect(formatCurrency(null)).toBe('0.00 ETB');
      expect(formatCurrency(undefined)).toBe('0.00 ETB');
      expect(formatCurrency('invalid')).toBe('0.00 ETB');
    });
  });

  describe('formatEthiopianPhone', () => {
    it('should format 10-digit phone numbers starting with 09', () => {
      expect(formatEthiopianPhone('0912345678')).toBe('091 234 5678');
    });

    it('should format 12-digit phone numbers starting with 251', () => {
      expect(formatEthiopianPhone('251912345678')).toBe('+251 91 234 5678');
    });

    it('should return original value for unsupported phone formats', () => {
      expect(formatEthiopianPhone('12345')).toBe('12345');
      expect(formatEthiopianPhone('')).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('should convert bytes to human-readable size labels', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('truncate', () => {
    it('should truncate strings exceeding target length', () => {
      expect(truncate('HelloWorldThisIsATest', 15)).toBe('HelloWorldTh...');
    });

    it('should leave short strings unmodified', () => {
      expect(truncate('Short', 15)).toBe('Short');
    });

    it('should handle empty or null values', () => {
      expect(truncate(null)).toBe('');
      expect(truncate('')).toBe('');
    });
  });

  describe('toSlug', () => {
    it('should generate URL-friendly slug versions of strings', () => {
      expect(toSlug('Hello World! Testing Slug...')).toBe('hello-world-testing-slug');
      expect(toSlug('   Extra   Spaces  ')).toBe('extra-spaces');
    });
  });
});
