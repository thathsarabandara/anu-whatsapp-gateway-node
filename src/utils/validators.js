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
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    skip: Joi.number().min(0).default(0),
  }),
};

module.exports = {
  validate,
  schemas,
  Joi,
};
