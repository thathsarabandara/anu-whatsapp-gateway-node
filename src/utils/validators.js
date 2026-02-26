const Joi = require('joi');

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
  id: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required(),
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    skip: Joi.number().min(0).default(0),
  }),
};

/**
 * Phone number validator function
 * @param {string} phoneNumber
 * @returns {object} { error: undefined|Error }
 */
const validatePhoneNumber = (phoneNumber) => {
  try {
    const { error } = schemas.phoneNumber.validate(phoneNumber);
    return { error };
  } catch (error) {
    return { error };
  }
};

/**
 * Email validator function
 * @param {string} email
 * @returns {object} { error: undefined|Error }
 */
const validateEmail = (email) => {
  try {
    const { error } = schemas.email.validate(email);
    return { error };
  } catch (error) {
    return { error };
  }
};

/**
 * Message validator function
 * @param {string} message
 * @returns {object} { error: undefined|Error }
 */
const validateMessage = (message) => {
  try {
    const messageSchema = Joi.string().min(1).required();
    const { error } = messageSchema.validate(message);
    return { error };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  validate,
  schemas,
  validatePhoneNumber,
  validateEmail,
  validateMessage,
  Joi,
};
