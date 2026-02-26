// eslint-disable-next-line import/no-extraneous-dependencies
const Queue = require('bull');
const config = require('../config/config');
const logger = require('../utils/logger');

let messageQueue = null;

const buildRedisOptions = () => {
  const hasExplicitHost = typeof process.env.REDIS_HOST !== 'undefined';
  const hasExplicitPort = typeof process.env.REDIS_PORT !== 'undefined';
  const hasExplicitPassword = typeof process.env.REDIS_PASSWORD !== 'undefined';
  const hasExplicitDb = typeof process.env.REDIS_DB !== 'undefined';

  if (config.redis.url) {
    const url = new URL(config.redis.url);
    const dbFromUrl = url.pathname ? parseInt(url.pathname.replace('/', ''), 10) : NaN;
    const redisHost = hasExplicitHost ? config.redis.host : url.hostname || config.redis.host;
    const redisPort = hasExplicitPort
      ? config.redis.port
      : parseInt(url.port || `${config.redis.port}`, 10);
    const redisPassword = hasExplicitPassword
      ? config.redis.password
      : url.password || config.redis.password;
    const redisDb = hasExplicitDb || Number.isNaN(dbFromUrl)
      ? config.redis.db
      : dbFromUrl;

    return {
      redis: {
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        db: redisDb,
      },
    };
  }

  return {
    redis: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    },
  };
};

const init = async ({ messageService } = {}) => {
  if (!messageService) {
    throw new Error('messageService is required to initialize jobs');
  }

  if (messageQueue) {
    return messageQueue;
  }

  messageQueue = new Queue('messages', buildRedisOptions());
  await messageQueue.isReady();

  messageQueue.process(5, async (job) => messageService.processQueuedMessage(job));

  messageQueue.on('completed', (job) => {
    logger.info('Queue job completed', { jobId: job.id });
  });

  messageQueue.on('failed', (job, error) => {
    logger.error('Queue job failed', { jobId: job?.id, error: error.message });
  });

  messageQueue.on('error', (error) => {
    const fallback = typeof error === 'string' ? error : 'Unknown queue error';
    const message = error?.message || fallback;

    logger.error('Queue error', {
      error: message,
      code: error?.code || null,
      syscall: error?.syscall || null,
      hostname: error?.hostname || null,
      stack: error?.stack || null,
    });
  });

  logger.info('Message queue initialized', {
    redisHost: buildRedisOptions().redis.host,
    redisPort: buildRedisOptions().redis.port,
    redisDb: buildRedisOptions().redis.db,
  });
  return messageQueue;
};

const getMessageQueue = () => {
  if (!messageQueue) {
    throw new Error('Message queue is not initialized');
  }
  return messageQueue;
};

const close = async () => {
  if (messageQueue) {
    await messageQueue.close();
    messageQueue = null;
  }
};

module.exports = {
  init,
  close,
  getMessageQueue,
};
