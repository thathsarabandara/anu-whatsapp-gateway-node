const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
const config = require('./config');

/**
 * Create database if not exists
 */
const createDatabaseIfNotExists = async () => {
  const tempConfig = {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
  };

  try {
    const connection = await mysql.createConnection(tempConfig);
    const dbName = config.database.name;

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
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
    // Messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id CHAR(36) PRIMARY KEY,
        from_phone VARCHAR(20),
        to_phone VARCHAR(20) NOT NULL,
        content LONGTEXT NOT NULL,
        message_type ENUM('OTP', 'NOTIFICATION', 'CHATBOT', 'CHATBOT_RESPONSE', 'STUDENT_QUERY') DEFAULT 'NOTIFICATION',
        direction ENUM('INBOUND', 'OUTBOUND') DEFAULT 'OUTBOUND',
        status ENUM('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED') DEFAULT 'QUEUED',
        priority ENUM('HIGH', 'NORMAL', 'LOW') DEFAULT 'NORMAL',
        whatsapp_message_id VARCHAR(100),
        gateway_message_id VARCHAR(100) UNIQUE,
        in_response_to CHAR(36),
        retry_count INT DEFAULT 0,
        max_retries INT DEFAULT 5,
        next_retry_at TIMESTAMP NULL,
        sent_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        read_at TIMESTAMP NULL,
        error_message LONGTEXT,
        error_code VARCHAR(10),
        lms_user_id VARCHAR(50),
        lms_context VARCHAR(100),
        meta_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_to_phone (to_phone),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_lms_user_id (lms_user_id),
        INDEX idx_message_type (message_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('Messages table created or already exists');

    // Contacts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id CHAR(36) PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100),
        lms_user_id VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP NULL,
        last_error VARCHAR(255),
        total_messages_sent INT DEFAULT 0,
        total_messages_received INT DEFAULT 0,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_lms_user_id (lms_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('Contacts table created or already exists');

    // Conversations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id CHAR(36) PRIMARY KEY,
        from_phone VARCHAR(20) NOT NULL,
        from_name VARCHAR(100),
        last_message_at TIMESTAMP NULL,
        last_message_content LONGTEXT,
        message_count INT DEFAULT 0,
        status ENUM('ACTIVE', 'CLOSED', 'ARCHIVED') DEFAULT 'ACTIVE',
        context_type VARCHAR(50),
        context_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_from_phone (from_phone),
        INDEX idx_last_message_at (last_message_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('Conversations table created or already exists');

    // RateLimits table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id CHAR(36) PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        message_type VARCHAR(50) NOT NULL,
        usage_count INT DEFAULT 0,
        reset_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        metadata JSON,
        UNIQUE KEY idx_phone_type (phone, message_type),
        INDEX idx_reset_at (reset_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('RateLimits table created or already exists');

    // WebhooksHistory table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS webhooks_history (
        id CHAR(36) PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        webhook_url VARCHAR(500) NOT NULL,
        payload JSON,
        response_status INT,
        response_body LONGTEXT,
        attempts INT DEFAULT 0,
        success BOOLEAN DEFAULT FALSE,
        error LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP NULL,
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('WebhooksHistory table created or already exists');

    // QueueJobs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS queue_jobs (
        id VARCHAR(100) PRIMARY KEY,
        job_type VARCHAR(100) NOT NULL,
        status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
        data JSON,
        result JSON,
        error LONGTEXT,
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 5,
        scheduled_for TIMESTAMP NULL,
        executed_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_job_type (job_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('QueueJobs table created or already exists');

    // WhatsAppCredentials table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS whatsapp_credentials (
        id CHAR(36) PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        encrypted_creds LONGTEXT,
        credentials_hash VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        status ENUM('ACTIVE', 'INACTIVE', 'ERROR') DEFAULT 'ACTIVE',
        last_connection_at TIMESTAMP NULL,
        last_error VARCHAR(255),
        battery_level INT,
        is_online BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_phone (phone),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('WhatsAppCredentials table created or already exists');

    logger.info('All database tables initialized successfully');
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
    if (dbConnection) {
      await initializeTables(dbConnection);
    }
    logger.info('Database initialization completed successfully');
    return true;
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await initialize();
      logger.info('Database initialization successful');
      process.exit(0);
    } catch (error) {
      logger.error('Database initialization failed', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  createDatabaseIfNotExists,
  initializeTables,
  initialize,
};
