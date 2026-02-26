// eslint-disable-next-line import/no-extraneous-dependencies
const Queue = require('bull');
const config = require('../config/config');
const logger = require('../utils/logger');

let messageQueue = null;

const buildRedisOptions = () => {
  if (config.redis.url) {
    return config.redis.url;
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

  messageQueue.process(5, async (job) => messageService.processQueuedMessage(job));

  messageQueue.on('completed', (job) => {
    logger.info('Queue job completed', { jobId: job.id });
  });

  messageQueue.on('failed', (job, error) => {
    logger.error('Queue job failed', { jobId: job?.id, error: error.message });
  });

  messageQueue.on('error', (error) => {
    logger.error('Queue error', { error: error.message });
  });

  logger.info('Message queue initialized');
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
