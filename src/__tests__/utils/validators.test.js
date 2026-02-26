const validators = require('../../utils/validators');

describe('Validators Utility', () => {
  describe('validatePhoneNumber', () => {
    it('should validate and normalize valid phone numbers', () => {
      const result = validators.validatePhoneNumber('+1 (123) 456-7890');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('11234567890');
    });

    it('should reject invalid phone numbers', () => {
      expect(validators.validatePhoneNumber('')).toEqual({
        valid: false,
        error: 'Phone number is required',
      });

      expect(validators.validatePhoneNumber('123')).toEqual({
        valid: false,
        error: 'Phone number must be 10-15 digits',
      });
    });
  });

  describe('validateMessageContent', () => {
    it('should accept valid message content', () => {
      expect(validators.validateMessageContent('Valid message').valid).toBe(true);
    });

    it('should reject invalid message content', () => {
      expect(validators.validateMessageContent('')).toEqual({
        valid: false,
        error: 'Message content must be a non-empty string',
      });

      expect(validators.validateMessageContent('   ')).toEqual({
        valid: false,
        error: 'Message content cannot be empty',
      });

      expect(validators.validateMessageContent('a'.repeat(4097))).toEqual({
        valid: false,
        error: 'Message content exceeds maximum length (4096 characters)',
      });
    });
  });

  describe('enum validators', () => {
    it('should validate message type and reject invalid type', () => {
      expect(validators.validateMessageType('OTP').valid).toBe(true);
      expect(validators.validateMessageType('INVALID').valid).toBe(false);
    });

    it('should validate priority and reject invalid priority', () => {
      expect(validators.validatePriority('HIGH').valid).toBe(true);
      expect(validators.validatePriority('URGENT').valid).toBe(false);
    });

    it('should validate status and reject invalid status', () => {
      expect(validators.validateMessageStatus('SENT').valid).toBe(true);
      expect(validators.validateMessageStatus('UNKNOWN').valid).toBe(false);
    });
  });

  describe('validateAPIKey and validateUUID', () => {
    it('should validate api key', () => {
      expect(validators.validateAPIKey('secret-key').valid).toBe(true);
      expect(validators.validateAPIKey(' ').valid).toBe(false);
    });

    it('should validate uuid format', () => {
      expect(validators.validateUUID('550e8400-e29b-41d4-a716-446655440000').valid).toBe(true);
      expect(validators.validateUUID('not-a-uuid').valid).toBe(false);
    });
  });

  describe('validate with Joi schemas', () => {
    it('should validate data successfully', async () => {
      const payload = {
        phone: '1234567890',
        content: 'hello',
      };

      const result = await validators.validate(payload, validators.schemas.sendMessage);
      expect(result.valid).toBe(true);
      expect(result.data.phone).toBe('1234567890');
      expect(result.data.messageType).toBe('NOTIFICATION');
      expect(result.data.priority).toBe('NORMAL');
    });

    it('should return detailed errors for invalid data', async () => {
      const payload = {
        phone: 'abc',
        content: '',
      };

      const result = await validators.validate(payload, validators.schemas.sendMessage);
      expect(result.valid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error) => error.field === 'phone')).toBe(true);
      expect(result.errors.some((error) => error.field === 'content')).toBe(true);
    });
  });
});
