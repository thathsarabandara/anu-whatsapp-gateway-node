const validators = require('../../utils/validators');

describe('Validators Utility', () => {
  describe('validatePhoneNumber', () => {
    it('should be a function', () => {
      expect(typeof validators.validatePhoneNumber).toBe('function');
    });

    it('should validate phone numbers', () => {
      const validNumbers = ['1234567890', '9876543210', '+11234567890'];
      validNumbers.forEach((num) => {
        const result = validators.validatePhoneNumber(num);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = ['', 'abc', '12'];
      invalidNumbers.forEach((num) => {
        const result = validators.validatePhoneNumber(num);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateEmail', () => {
    it('should be a function', () => {
      expect(typeof validators.validateEmail).toBe('function');
    });

    it('should validate emails', () => {
      const validEmails = ['test@example.com', 'user@domain.co.uk'];
      validEmails.forEach((email) => {
        const result = validators.validateEmail(email);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = ['', 'notanemail', '@example.com'];
      invalidEmails.forEach((email) => {
        const result = validators.validateEmail(email);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateMessage', () => {
    it('should be a function', () => {
      expect(typeof validators.validateMessage).toBe('function');
    });

    it('should validate messages', () => {
      const result = validators.validateMessage('Valid message content');
      expect(result.error).toBeUndefined();
    });

    it('should reject empty messages', () => {
      const result = validators.validateMessage('');
      expect(result.error).toBeDefined();
    });
  });
});
