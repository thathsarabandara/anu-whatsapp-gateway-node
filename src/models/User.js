const database = require('../config/database');
const logger = require('../utils/logger');

class User {
  /**
   * Create a new user
   */
  static async create(phoneNumber, name = null, email = null) {
    try {
      const result = await database.query(
        'INSERT INTO users (phone_number, name, email) VALUES (?, ?, ?)',
        [phoneNumber, name, email],
      );
      logger.info(`User created with ID: ${result.insertId}`);
      return {
        id: result.insertId,
        phoneNumber,
        name,
        email,
      };
    } catch (error) {
      logger.error('Failed to create user', { error: error.message });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const results = await database.query(
        'SELECT * FROM users WHERE id = ?',
        [id],
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Failed to find user by ID', { error: error.message });
      throw error;
    }
  }

  /**
   * Find user by phone number
   */
  static async findByPhoneNumber(phoneNumber) {
    try {
      const results = await database.query(
        'SELECT * FROM users WHERE phone_number = ?',
        [phoneNumber],
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Failed to find user by phone number', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all users
   */
  static async findAll(status = null, limit = 100, offset = 0) {
    try {
      let query = 'SELECT * FROM users';
      const params = [];

      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      return database.query(query, params);
    } catch (error) {
      logger.error('Failed to find all users', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user
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

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      const result = await database.query(query, values);

      logger.info(`User ${id} updated`);
      return result;
    } catch (error) {
      logger.error('Failed to update user', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async delete(id) {
    try {
      const result = await database.query('DELETE FROM users WHERE id = ?', [id]);
      logger.info(`User ${id} deleted`);
      return result;
    } catch (error) {
      logger.error('Failed to delete user', { error: error.message });
      throw error;
    }
  }
}

module.exports = User;
