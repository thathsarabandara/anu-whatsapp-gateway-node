/**
 * Custom Error Classes
 */

class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = {}) {
    super(message, 401, details);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied', details = {}) {
    super(message, 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = {}) {
    super(message, 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = {}) {
    super(message, 409, details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details = {}) {
    super(message, 429, details);
  }
}

class ServerError extends AppError {
  constructor(message = 'Internal server error', details = {}) {
    super(message, 500, details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details = {}) {
    super(message, 503, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  ServiceUnavailableError,
};
