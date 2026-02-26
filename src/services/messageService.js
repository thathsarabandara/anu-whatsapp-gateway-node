/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require('uuid');
const { Message, Contact } = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');
const validators = require('../utils/validators');
const rateLimitService = require('./rateLimitService');
const webhookService = require('./webhookService');

class MessageService {
  constructor() {
    this.queue = null;
    this.baileysService = null;
  }

  configure({ queue, baileysService }) {
    this.queue = queue;
    this.baileysService = baileysService;
  }

  normalizeMessageType(messageType) {
    if (messageType === 'CHATBOT_RESPONSE') {
      return 'CHATBOT';
    }
    const supported = ['OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL'];
    return supported.includes(messageType) ? messageType : 'GENERAL';
  }

  async queueMessage(payload) {
    if (!this.queue) {
      throw new Error('Message queue is not initialized');
    }

    const {
      phone,
      content,
      messageType = 'NOTIFICATION',
      priority = 'NORMAL',
      lmsContext = null,
      lmsUserId = null,
    } = payload;

    const phoneValidation = validators.validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error };
    }

    const contentValidation = validators.validateMessageContent(content);
    if (!contentValidation.valid) {
      return { success: false, error: contentValidation.error };
    }

    const normalizedType = this.normalizeMessageType(messageType);

    if (config.features.enableRateLimiting) {
      const limit = await rateLimitService.checkLimit(phoneValidation.formatted, normalizedType);
      if (!limit.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Remaining: ${limit.remaining}`,
        };
      }
    }

    const [contact] = await Contact.findOrCreate({
      where: { phone: phoneValidation.formatted },
      defaults: {
        phone: phoneValidation.formatted,
        lmsUserId,
      },
    });

    const message = await Message.create({
      id: uuidv4(),
      toPhone: phoneValidation.formatted,
      fromPhone: config.whatsapp.phonePrimary || 'GATEWAY',
      body: content,
      messageType: normalizedType,
      status: 'QUEUED',
      direction: 'OUTBOUND',
      priority,
      lmsUserId,
      metadata: {
        lmsContext,
        contactId: contact.id,
      },
    });

    const queuePriority = this.calculateQueuePriority(priority, normalizedType);
    const job = await this.queue.add(
      {
        messageId: message.id,
      },
      {
        attempts: config.queue.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: config.queue.backoffDelay,
        },
        priority: queuePriority,
        removeOnComplete: config.queue.removeOnComplete,
      },
    );

    if (config.features.enableRateLimiting) {
      await rateLimitService.incrementUsage(phoneValidation.formatted, normalizedType);
    }

    return {
      success: true,
      messageId: message.id,
      jobId: job.id,
      status: message.status,
      queuedAt: message.createdAt,
    };
  }

  calculateQueuePriority(priority, messageType) {
    const priorityWeight = {
      HIGH: 10,
      NORMAL: 5,
      LOW: 1,
    };

    const typeWeight = {
      OTP: 3,
      NOTIFICATION: 2,
      CHATBOT: 1,
      GENERAL: 1,
    };

    return (priorityWeight[priority] || 5) * (typeWeight[messageType] || 1);
  }

  async processQueuedMessage(job) {
    if (!this.baileysService) {
      throw new Error('Baileys service is not configured');
    }

    const { messageId } = job.data;
    const message = await Message.findByPk(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    try {
      const result = await this.baileysService.sendMessage(message.toPhone, message.body);

      message.status = 'SENT';
      message.sentAt = new Date();
      message.metadata = {
        ...(message.metadata || {}),
        whatsappMessageId: result.whatsappMessageId,
      };
      await message.save();

      return {
        success: true,
        messageId,
        whatsappMessageId: result.whatsappMessageId,
      };
    } catch (error) {
      message.status = 'FAILED';
      message.errorReason = error.message;
      message.retryCount += 1;
      await message.save();

      logger.error('Failed to send queued message', {
        error: error.message,
        messageId,
      });

      throw error;
    }
  }

  async getMessageStatus(messageId) {
    const message = await Message.findByPk(messageId);
    if (!message) {
      return null;
    }

    return {
      messageId: message.id,
      status: message.status,
      toPhone: message.toPhone,
      fromPhone: message.fromPhone,
      messageType: message.messageType,
      priority: message.priority,
      direction: message.direction,
      retryCount: message.retryCount,
      sentAt: message.sentAt,
      deliveredAt: message.deliveredAt,
      errorReason: message.errorReason,
      metadata: message.metadata,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  async listMessages(filters) {
    const {
      status,
      type,
      phone,
      limit = 20,
      offset = 0,
    } = filters;

    const where = {};
    if (status) where.status = status;
    if (type) where.messageType = this.normalizeMessageType(type);
    if (phone) where.toPhone = phone;

    return Message.findAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  async deleteQueuedMessage(messageId) {
    const message = await Message.findByPk(messageId);
    if (!message) {
      return { success: false, statusCode: 404, message: 'Message not found' };
    }

    if (message.status !== 'QUEUED') {
      return { success: false, statusCode: 400, message: 'Only queued messages can be deleted' };
    }

    await message.destroy();
    return { success: true, statusCode: 200 };
  }

  async handleIncomingMessage(phone, baileyMessage) {
    const fromJid = baileyMessage?.key?.remoteJid || '';
    const fromPhone = fromJid.split('@')[0] || null;
    const content = baileyMessage?.message?.conversation
      || baileyMessage?.message?.extendedTextMessage?.text
      || null;

    if (!fromPhone || !content || baileyMessage?.key?.fromMe) {
      return;
    }

    const [contact] = await Contact.findOrCreate({
      where: { phone: fromPhone },
      defaults: { phone: fromPhone },
    });

    const message = await Message.create({
      id: uuidv4(),
      toPhone: config.whatsapp.phonePrimary || phone,
      fromPhone,
      body: content,
      messageType: 'CHATBOT',
      status: 'DELIVERED',
      direction: 'INBOUND',
      priority: 'NORMAL',
      metadata: {
        sourcePhone: phone,
        contactId: contact.id,
      },
      deliveredAt: new Date(),
    });

    await webhookService.sendIncomingMessage({
      messageId: message.id,
      fromPhone,
      content,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new MessageService();
