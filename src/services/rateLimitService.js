const { RateLimit } = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');

class RateLimitService {
  constructor() {
    this.limits = {
      OTP: config.rateLimit.otp,
      NOTIFICATION: config.rateLimit.notification,
      CHATBOT: config.rateLimit.chatbot,
      GENERAL: config.rateLimit.general,
    };
  }

  async checkLimit(phone, messageType) {
    try {
      const now = new Date();
      const type = this.normalizeType(messageType);
      const limitCount = this.limits[type] || config.rateLimit.general;

      const entry = await RateLimit.findOne({
        where: {
          phone,
          messageType: type,
        },
      });

      if (!entry) {
        return {
          allowed: true,
          limit: limitCount,
          used: 0,
          remaining: limitCount,
        };
      }

      if (entry.resetAt && entry.resetAt <= now) {
        entry.currentCount = 0;
        entry.resetAt = new Date(now.getTime() + (entry.windowSeconds * 1000));
        await entry.save();
      }

      const allowed = entry.currentCount < limitCount;
      return {
        allowed,
        limit: limitCount,
        used: entry.currentCount,
        remaining: Math.max(0, limitCount - entry.currentCount),
      };
    } catch (error) {
      logger.error('Rate limit check failed', { error: error.message, phone, messageType });
      return {
        allowed: true,
        limit: this.limits.GENERAL,
        used: 0,
        remaining: this.limits.GENERAL,
      };
    }
  }

  async incrementUsage(phone, messageType) {
    try {
      const now = new Date();
      const type = this.normalizeType(messageType);
      const limitCount = this.limits[type] || config.rateLimit.general;
      const windowSeconds = 3600;

      const [entry] = await RateLimit.findOrCreate({
        where: {
          phone,
          messageType: type,
        },
        defaults: {
          phone,
          messageType: type,
          limitCount,
          windowSeconds,
          currentCount: 0,
          resetAt: new Date(now.getTime() + (windowSeconds * 1000)),
        },
      });

      if (entry.resetAt && entry.resetAt <= now) {
        entry.currentCount = 0;
        entry.resetAt = new Date(now.getTime() + (entry.windowSeconds * 1000));
      }

      entry.limitCount = limitCount;
      entry.currentCount += 1;
      await entry.save();
    } catch (error) {
      logger.error('Failed to increment rate limit usage', { error: error.message, phone, messageType });
    }
  }

  normalizeType(messageType) {
    if (messageType === 'CHATBOT_RESPONSE') {
      return 'CHATBOT';
    }
    if (!this.limits[messageType]) {
      return 'GENERAL';
    }
    return messageType;
  }
}

module.exports = new RateLimitService();
