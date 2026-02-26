/* eslint-disable class-methods-use-this */
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { WebhookHistory } = require('../models');

class WebhookService {
  async sendIncomingMessage(payload) {
    if (!config.features.enableWebhookNotifications || !config.webhook.url) {
      return;
    }

    const webhookPayload = {
      event: 'message.incoming',
      timestamp: new Date().toISOString(),
      data: payload,
      signature: this.generateSignature(payload),
    };

    try {
      const response = await axios.post(config.webhook.url, webhookPayload, {
        timeout: config.webhook.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': config.webhook.secret || '',
        },
      });

      await WebhookHistory.create({
        messageId: payload.messageId || null,
        eventType: 'message.incoming',
        webhookUrl: config.webhook.url,
        payload: JSON.stringify(webhookPayload),
        status: 'SUCCESS',
        retryCount: 0,
        responseData: JSON.stringify({ status: response.status, data: response.data }),
        sentAt: new Date(),
      });
    } catch (error) {
      logger.error('Webhook delivery failed', { error: error.message });

      await WebhookHistory.create({
        messageId: payload.messageId || null,
        eventType: 'message.incoming',
        webhookUrl: config.webhook.url,
        payload: JSON.stringify(webhookPayload),
        status: 'FAILED',
        retryCount: 1,
        responseData: JSON.stringify({
          status: error.response?.status || 0,
          message: error.message,
        }),
        sentAt: new Date(),
      });
    }
  }

  generateSignature(data) {
    return crypto
      .createHmac('sha256', config.webhook.secret || '')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}

module.exports = new WebhookService();
