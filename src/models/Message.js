const database = require('../config/database');
const logger = require('../utils/logger');

class Message {
  /**
   * Create a new message
   */
  static async create(userId, messageText, direction, externalMessageId = null) {
    try {
      const result = await database.query(
        `INSERT INTO messages (user_id, message_text, direction, external_message_id, status) 
         VALUES (?, ?, ?, ?, 'pending')`,
        [userId, messageText, direction, externalMessageId],
      );
      logger.info(`Message created with ID: ${result.insertId}`);
      return {
        id: result.insertId,
        userId,
        messageText,
        direction,
      };
    } catch (error) {
      logger.error('Failed to create message', { error: error.message });
      throw error;
    }
  }

  /**
   * Find message by ID
   */
  static async findById(id) {
    try {
      const results = await database.query(
        'SELECT * FROM messages WHERE id = ?',
        [id],
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Failed to find message by ID', { error: error.message });
      throw error;
    }
  }

  /**
   * Get messages for a user
   */
  static async findByUserId(userId, status = null, limit = 100, offset = 0) {
    try {
      let query = 'SELECT * FROM messages WHERE user_id = ?';
      const params = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      return database.query(query, params);
    } catch (error) {
      logger.error('Failed to find messages by user ID', { error: error.message });
      throw error;
    }
  }

  /**
   * Update message status
   */
  static async updateStatus(id, status) {
    try {
      const result = await database.query(
        'UPDATE messages SET status = ? WHERE id = ?',
        [status, id],
      );
      logger.info(`Message ${id} status updated to ${status}`);
      return result;
    } catch (error) {
      logger.error('Failed to update message status', { error: error.message });
      throw error;
    }
  }

  /**
   * Get message statistics for a user
   */
  static async getStatistics(userId) {
    try {
      const results = await database.query(
        `SELECT 
          direction,
          status,
          COUNT(*) as count
         FROM messages 
         WHERE user_id = ?
         GROUP BY direction, status`,
        [userId],
      );
      return results;
    } catch (error) {
      logger.error('Failed to get message statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete message
   */
  static async delete(id) {
    try {
      const result = await database.query('DELETE FROM messages WHERE id = ?', [id]);
      logger.info(`Message ${id} deleted`);
      return result;
    } catch (error) {
      logger.error('Failed to delete message', { error: error.message });
      throw error;
    }
  }
}

module.exports = Message;
