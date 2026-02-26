const database = require('../config/database');
const logger = require('../utils/logger');

class Webhook {
  /**
   * Create a new webhook
   */
  static async create(userId, webhookUrl, eventType = 'all') {
    try {
      const result = await database.query(
        `INSERT INTO webhooks (user_id, webhook_url, event_type) 
         VALUES (?, ?, ?)`,
        [userId, webhookUrl, eventType],
      );
      logger.info(`Webhook created with ID: ${result.insertId}`);
      return {
        id: result.insertId,
        userId,
        webhookUrl,
        eventType,
      };
    } catch (error) {
      logger.error('Failed to create webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Find webhook by ID
   */
  static async findById(id) {
    try {
      const results = await database.query(
        'SELECT * FROM webhooks WHERE id = ?',
        [id],
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Failed to find webhook by ID', { error: error.message });
      throw error;
    }
  }

  /**
   * Find all webhooks for a user
   */
  static async findByUserId(userId, isActive = true) {
    try {
      const query = isActive
        ? 'SELECT * FROM webhooks WHERE user_id = ? AND is_active = TRUE'
        : 'SELECT * FROM webhooks WHERE user_id = ?';

      const params = isActive ? [userId] : [userId];
      return database.query(query, params);
    } catch (error) {
      logger.error('Failed to find webhooks by user ID', { error: error.message });
      throw error;
    }
  }

  /**
   * Update webhook
   */
  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updates).forEach((key) => {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      });

      values.push(id);

      const query = `UPDATE webhooks SET ${fields.join(', ')} WHERE id = ?`;
      const result = await database.query(query, values);

      logger.info(`Webhook ${id} updated`);
      return result;
    } catch (error) {
      logger.error('Failed to update webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Toggle webhook status
   */
  static async toggleStatus(id) {
    try {
      const result = await database.query(
        'UPDATE webhooks SET is_active = NOT is_active WHERE id = ?',
        [id],
      );
      logger.info(`Webhook ${id} status toggled`);
      return result;
    } catch (error) {
      logger.error('Failed to toggle webhook status', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete webhook
   */
  static async delete(id) {
    try {
      const result = await database.query('DELETE FROM webhooks WHERE id = ?', [id]);
      logger.info(`Webhook ${id} deleted`);
      return result;
    } catch (error) {
      logger.error('Failed to delete webhook', { error: error.message });
      throw error;
    }
  }
}

module.exports = Webhook;
