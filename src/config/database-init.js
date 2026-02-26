const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

/**
 * Create database if not exists
 */
const createDatabaseIfNotExists = async () => {
  const tempConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
  };

  try {
    const connection = await mysql.createConnection(tempConfig);
    const dbName = process.env.DB_NAME || 'whatsapp_gateway';

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    logger.info(`Database '${dbName}' ensured to exist`);

    await connection.end();
    return true;
  } catch (error) {
    logger.error('Failed to create database', { error: error.message });
    throw error;
  }
};

/**
 * Initialize all database tables
 */
const initializeTables = async (connection) => {
  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255),
        email VARCHAR(255),
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone_number (phone_number),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('Users table created or already exists');

    // Create messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message_text LONGTEXT,
        direction ENUM('inbound', 'outbound') NOT NULL,
        status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
        external_message_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_direction (direction),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('Messages table created or already exists');

    // Create webhooks table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        webhook_url VARCHAR(500) NOT NULL,
        event_type SET('message_received', 'message_sent', 'user_status_change', 'all') DEFAULT 'all',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('Webhooks table created or already exists');
  } catch (error) {
    logger.error('Failed to initialize tables', { error: error.message });
    throw error;
  }
};

/**
 * Initialize database - create database and tables
 */
const initialize = async (dbConnection) => {
  try {
    await createDatabaseIfNotExists();
    await initializeTables(dbConnection);
    logger.info('Database initialization completed successfully');
    return true;
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  createDatabaseIfNotExists,
  initializeTables,
  initialize,
};
