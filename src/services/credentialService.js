const { WhatsAppCredential } = require('../models');
const logger = require('../utils/logger');

class CredentialService {
  static async saveCredentials(phone, credentials, options = {}) {
    const {
      status = null,
      connectionStatus = null,
    } = options;

    try {
      const existing = await WhatsAppCredential.findOne({ where: { phone } });

      if (existing) {
        if (credentials) {
          existing.credentials = credentials;
        }
        if (status) {
          existing.status = status;
        }
        if (connectionStatus) {
          existing.connectionStatus = connectionStatus;
        }
        existing.lastHeartbeatAt = new Date();
        await existing.save();
        return existing;
      }

      return WhatsAppCredential.create({
        phone,
        credentials,
        status: status || 'DISCONNECTED',
        connectionStatus: connectionStatus || 'DISCONNECTED',
        firstConnectedAt: new Date(),
        lastHeartbeatAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to save credentials', { error: error.message, phone });
      throw error;
    }
  }

  static async loadCredentials(phone) {
    try {
      const record = await WhatsAppCredential.findOne({ where: { phone } });
      if (!record) return null;
      return record.credentials;
    } catch (error) {
      logger.error('Failed to load credentials', { error: error.message, phone });
      return null;
    }
  }

  static async resetCredentials(phone) {
    try {
      const record = await WhatsAppCredential.findOne({ where: { phone } });
      if (!record) return false;

      record.credentials = null;
      record.status = 'DISCONNECTED';
      record.connectionStatus = 'DISCONNECTED';
      record.lastHeartbeatAt = new Date();
      await record.save();
      return true;
    } catch (error) {
      logger.error('Failed to reset credentials', { error: error.message, phone });
      return false;
    }
  }

  static async updateConnectionStatus(phone, status, connectionStatus = null) {
    try {
      const record = await WhatsAppCredential.findOne({ where: { phone } });
      if (!record) return;

      record.status = status;
      if (connectionStatus) {
        record.connectionStatus = connectionStatus;
      }
      record.lastHeartbeatAt = new Date();
      await record.save();
    } catch (error) {
      logger.error('Failed to update credential status', { error: error.message, phone, status });
    }
  }

  static async ensurePhoneRecord(phone) {
    if (!phone) return null;

    const existing = await WhatsAppCredential.findOne({ where: { phone } });
    if (existing) {
      return existing;
    }

    return WhatsAppCredential.create({
      phone,
      status: 'DISCONNECTED',
      connectionStatus: 'DISCONNECTED',
    });
  }

  static async getRegisteredPhones() {
    try {
      const rows = await WhatsAppCredential.findAll({
        attributes: ['phone'],
      });

      return rows
        .map((row) => row.phone)
        .filter(Boolean);
    } catch (error) {
      logger.error('Failed to load registered phones', { error: error.message });
      return [];
    }
  }
}

module.exports = CredentialService;
