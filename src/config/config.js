/**
 * Application Configuration
 * Loads configuration from environment variables with defaults
 */

require('dotenv').config();

module.exports = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  app: {
    name: 'WhatsApp Gateway',
    version: '1.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    workers: parseInt(process.env.WORKERS || '4', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    fileMaxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
    fileMaxFiles: process.env.LOG_FILE_MAX_FILES || '7d',
    console: process.env.LOG_CONSOLE !== 'false',
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'whatsapp_gateway',
    user: process.env.DB_USER || 'gateway',
    password: process.env.DB_PASSWORD || 'gateway_password',
    dialect: process.env.DB_DIALECT || 'mysql',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    timezone: process.env.DB_TIMEZONE || '+00:00',
    // eslint-disable-next-line no-console
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  },

  // WhatsApp
  whatsapp: {
    phonePrimary: process.env.WHATSAPP_PHONE_PRIMARY,
    phonesBackup: (process.env.WHATSAPP_PHONES_BACKUP || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
    connectionTimeout: parseInt(process.env.BAILEYS_CONNECTION_TIMEOUT || '30000', 10),
    syncFullHistory: process.env.BAILEYS_SYNC_FULL_HISTORY === 'true',
    markOnline: process.env.BAILEYS_MARK_ONLINE !== 'false',
  },

  // Messages
  messages: {
    sendTimeout: parseInt(process.env.MESSAGE_SEND_TIMEOUT || '10000', 10),
    ackWaitTimeout: parseInt(process.env.MESSAGE_ACK_WAIT_TIMEOUT || '15000', 10),
    deliveryCheckInterval: parseInt(process.env.MESSAGE_DELIVERY_CHECK_INTERVAL || '5000', 10),
    maxRetries: parseInt(process.env.MESSAGE_MAX_RETRIES || '5', 10),
    retryDelayMs: parseInt(process.env.MESSAGE_RETRY_DELAY_MS || '5000', 10),
    retryBackoffMultiplier: parseFloat(process.env.MESSAGE_RETRY_BACKOFF_MULTIPLIER || '2'),
  },

  // Rate Limiting
  rateLimit: {
    otp: parseInt(process.env.RATE_LIMIT_OTP || '30', 10),
    notification: parseInt(process.env.RATE_LIMIT_NOTIFICATION || '200', 10),
    chatbot: parseInt(process.env.RATE_LIMIT_CHATBOT || '100', 10),
    general: parseInt(process.env.RATE_LIMIT_GENERAL || '500', 10),
  },

  // Queue
  queue: {
    maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '5', 10),
    backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '5000', 10),
    removeOnComplete: process.env.QUEUE_REMOVE_ON_COMPLETE !== 'false',
    removeOnFailDays: parseInt(process.env.QUEUE_REMOVE_ON_FAIL_DAYS || '7', 10),
  },

  // Webhook
  webhook: {
    url: process.env.WEBHOOK_URL,
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '5000', 10),
    secret: process.env.WEBHOOK_SECRET,
  },

  // Security
  security: {
    apiKey: process.env.API_KEY,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    encryptionKey: process.env.ENCRYPTION_KEY || '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    encryptionIV: process.env.ENCRYPTION_IV || '000102030405060708090a0b0c0d0e0f',
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim()),
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS').split(','),
    headers: (process.env.CORS_HEADERS || 'Content-Type,Authorization').split(','),
  },

  // Features
  features: {
    enableMessageEncryption: process.env.ENABLE_MESSAGE_ENCRYPTION !== 'false',
    enableCredentialEncryption: process.env.ENABLE_CREDENTIAL_ENCRYPTION !== 'false',
    enableWebhookNotifications: process.env.ENABLE_WEBHOOK_NOTIFICATIONS !== 'false',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
    enableMessageRetry: process.env.ENABLE_MESSAGE_RETRY !== 'false',
  },

  // LMS Integration
  lms: {
    webhookUrl: process.env.LMS_WEBHOOK_URL,
    apiKey: process.env.LMS_API_KEY,
    contextPrefix: process.env.LMS_CONTEXT_PREFIX || 'lms',
  },
};
