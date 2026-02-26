const redis = require('redis');
const logger = require('../utils/logger');

const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  },
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  lazyConnect: false,
};

let client = null;

/**
 * Initialize Redis client
 */
const initializeClient = async () => {
  try {
    client = redis.createClient(redisConfig);

    client.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    await client.connect();
    logger.info('Redis client initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error: error.message });
    throw error;
  }
};

/**
 * Get Redis client
 */
const getClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

/**
 * Get value from cache
 */
const get = async (key) => {
  const redisClient = getClient();
  return redisClient.get(key);
};

/**
 * Set value in cache
 */
const set = async (key, value, expiryInSeconds = null) => {
  const redisClient = getClient();
  if (expiryInSeconds) {
    return redisClient.setEx(key, expiryInSeconds, value);
  }
  return redisClient.set(key, value);
};

/**
 * Delete cache key
 */
const del = async (key) => {
  const redisClient = getClient();
  return redisClient.del(key);
};

/**
 * Clear all cache
 */
const flushDb = async () => {
  const redisClient = getClient();
  return redisClient.flushDb();
};

/**
 * Close Redis connection
 */
const close = async () => {
  if (client) {
    await client.quit();
    logger.info('Redis client closed');
  }
};

module.exports = {
  initializeClient,
  getClient,
  get,
  set,
  del,
  flushDb,
  close,
};
