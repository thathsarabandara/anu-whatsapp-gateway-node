const Joi = require('joi');
const config = require('../config/config');

/**
 * Validation helper using Joi
 */
const validate = async (data, schema) => {
  try {
    const validated = await schema.validateAsync(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    return { valid: true, data: validated };
  } catch (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return { valid: false, errors: details };
  }
};

/**
 * Common validation schemas
 */
const schemas = {
  // Send Message Schema
  sendMessage: Joi.object({
    // Accept any reasonable phone string; normalisation is done by validatePhoneNumber
    phone: Joi.string().pattern(/^[\d\s()\-+.]{7,20}$/).required().messages({
      'string.pattern.base': 'Invalid phone number format. Provide digits in local or international format.',
    }),
    content: Joi.string().min(1).max(4096).required(),
    messageType: Joi.string().valid('OTP', 'NOTIFICATION', 'CHATBOT', 'CHATBOT_RESPONSE').default('NOTIFICATION'),
    priority: Joi.string().valid('HIGH', 'NORMAL', 'LOW').default('NORMAL'),
    lmsContext: Joi.string().optional(),
    lmsUserId: Joi.string().optional(),
  }).required(),

  // Get Message Status Schema
  getMessageStatus: Joi.object({
    messageId: Joi.string().uuid().required(),
  }).required(),

  // Webhook Notification Schema
  webhookNotification: Joi.object({
    event: Joi.string().valid('message_received', 'message_sent', 'delivery_status').required(),
    data: Joi.object().required(),
    timestamp: Joi.date().timestamp().required(),
  }).required(),

  // Rate Limit Query Schema
  rateLimitQuery: Joi.object({
    phone: Joi.string().pattern(/^[\d\s()\-+.]{7,20}$/).required(),
    type: Joi.string().valid('OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL').required(),
  }).required(),

  // Health Check Response
  healthCheck: Joi.object({
    status: Joi.string().required(),
    timestamp: Joi.date().required(),
  }).required(),

  // Connection Status Schema
  connectionStatus: Joi.object({
    phone: Joi.string().pattern(/^\d{10,15}$/).required(),
    status: Joi.string().valid('CONNECTED', 'DISCONNECTED', 'ERROR').required(),
  }).required(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
  }),
};

/**
 * Normalise and validate a phone number so it is safe to use as a
 * WhatsApp JID (digits-only, international format, no leading +).
 *
 * Accepted input examples:
 *  - Local format  : 0771234567  (10-digit with leading 0)
 *  - International : +94771234567 / 94771234567
 *  - With prefix   : 0094771234567 / 00771234567
 *  - With spaces   : +94 77 123 4567
 *  - With dashes   : +94-771-234-567
 *  - With parens   : +94(77)1234567
 *
 * The DEFAULT_COUNTRY_CODE config value is prepended when the caller
 * supplies a local-format number (starts with 0 after stripping).
 */
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return { valid: false, error: 'Phone number is required' };
  }

  if (typeof phoneNumber !== 'string') {
    return { valid: false, error: 'Phone number must be a string' };
  }

  // Step 1: strip every character that is not a digit
  let cleaned = phoneNumber.replace(/\D/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Phone number must contain digits' };
  }

  // Step 2: remove international dialling prefixes (00 or 011)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('011')) {
    cleaned = cleaned.slice(3);
  }

  // Step 3: handle local (trunk) format — a leading 0 followed by
  // the subscriber number.  The leading 0 is replaced by the
  // configured country code so the number becomes fully qualified.
  if (cleaned.startsWith('0')) {
    const defaultCountryCode = (config.phone && config.phone.defaultCountryCode) || '94';
    cleaned = defaultCountryCode + cleaned.slice(1);
  }

  // Step 4: final length guard (ITU-T E.164 allows up to 15 digits;
  // we allow down to 7 for short country codes + subscriber numbers)
  if (cleaned.length < 7 || cleaned.length > 15) {
    return {
      valid: false,
      error: `Phone number has an unexpected length after normalisation (${cleaned.length} digits). `
        + 'Provide a valid local or international number.',
    };
  }

  return {
    valid: true,
    formatted: cleaned,
    original: phoneNumber,
  };
};

/**
 * Validate message content
 */
const validateMessageContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content must be a non-empty string' };
  }

  if (content.trim().length === 0) {
    return { valid: false, error: 'Message content cannot be empty' };
  }

  if (content.length > 4096) {
    return { valid: false, error: 'Message content exceeds maximum length (4096 characters)' };
  }

  return { valid: true };
};

/**
 * Validate message type
 */
const validateMessageType = (type) => {
  const validTypes = ['OTP', 'NOTIFICATION', 'CHATBOT', 'CHATBOT_RESPONSE'];
  if (!validTypes.includes(type)) {
    return { valid: false, error: `Message type must be one of: ${validTypes.join(', ')}` };
  }
  return { valid: true };
};

/**
 * Validate priority level
 */
const validatePriority = (priority) => {
  const validPriorities = ['HIGH', 'NORMAL', 'LOW'];
  if (!validPriorities.includes(priority)) {
    return { valid: false, error: `Priority must be one of: ${validPriorities.join(', ')}` };
  }
  return { valid: true };
};

/**
 * Validate message status
 */
const validateMessageStatus = (status) => {
  const validStatuses = ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED'];
  if (!validStatuses.includes(status)) {
    return { valid: false, error: `Status must be one of: ${validStatuses.join(', ')}` };
  }
  return { valid: true };
};

/**
 * Validate API Key
 */
const validateAPIKey = (key) => {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return { valid: false, error: 'Valid API key is required' };
  }
  return { valid: true };
};

/**
 * Validate UUID
 */
const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  return { valid: true };
};

module.exports = {
  validate,
  schemas,
  validatePhoneNumber,
  validateMessageContent,
  validateMessageType,
  validatePriority,
  validateMessageStatus,
  validateAPIKey,
  validateUUID,
  Joi,
};
