-- Initial MySQL setup for WhatsApp Gateway
-- This file is run automatically by Docker when the container starts

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID',
  phone VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100),
  lms_user_id VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  total_messages_sent INT DEFAULT 0,
  total_messages_received INT DEFAULT 0,
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_lms_user_id (lms_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID',
  from_phone VARCHAR(20) NOT NULL,
  to_phone VARCHAR(20) NOT NULL,
  contact_id CHAR(36),
  status ENUM('ACTIVE', 'CLOSED', 'ARCHIVED') DEFAULT 'ACTIVE',
  message_type ENUM('OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL') DEFAULT 'GENERAL',
  context_type VARCHAR(50),
  context_data JSON,
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  close_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_to_phone (to_phone),
  INDEX idx_contact_id (contact_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID',
  to_phone VARCHAR(20) NOT NULL,
  from_phone VARCHAR(20) NOT NULL,
  conversation_id CHAR(36),
  lms_user_id VARCHAR(100),
  body LONGTEXT NOT NULL,
  message_type ENUM('OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL') DEFAULT 'GENERAL',
  status ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED') DEFAULT 'QUEUED',
  direction ENUM('INBOUND', 'OUTBOUND') NOT NULL,
  priority ENUM('LOW', 'NORMAL', 'HIGH') DEFAULT 'NORMAL',
  metadata JSON,
  error_reason TEXT,
  retry_count INT DEFAULT 0,
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_to_phone (to_phone),
  INDEX idx_from_phone (from_phone),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_lms_user_id (lms_user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID',
  phone VARCHAR(20) NOT NULL,
  message_type ENUM('OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL') DEFAULT 'GENERAL',
  limit_count INT DEFAULT 500,
  window_seconds INT DEFAULT 3600,
  current_count INT DEFAULT 0,
  reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_phone_message_type (phone, message_type),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create webhooks_history table
CREATE TABLE IF NOT EXISTS webhooks_history (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID',
  message_id CHAR(36),
  event_type VARCHAR(50) NOT NULL,
  webhook_url VARCHAR(500) NOT NULL,
  payload LONGTEXT,
  status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
  retry_count INT DEFAULT 0,
  target_system VARCHAR(50) DEFAULT 'LMS',
  response_data LONGTEXT,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_message_id (message_id),
  INDEX idx_event_type (event_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create queue_jobs table
CREATE TABLE IF NOT EXISTS queue_jobs (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID',
  bull_job_id VARCHAR(100) NOT NULL UNIQUE,
  queue_name VARCHAR(50) NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  job_data JSON,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
  priority ENUM('LOW', 'NORMAL', 'HIGH') DEFAULT 'NORMAL',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  result LONGTEXT,
  error LONGTEXT,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_queue_name (queue_name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create whatsapp_credentials table
CREATE TABLE IF NOT EXISTS whatsapp_credentials (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID',
  phone VARCHAR(20) NOT NULL UNIQUE,
  credentials LONGTEXT,
  status ENUM('CONNECTED', 'DISCONNECTED', 'DELETED') DEFAULT 'DISCONNECTED',
  connection_status ENUM('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'RECONNECTING') DEFAULT 'DISCONNECTED',
  battery_level INT,
  device_info JSON,
  first_connected_at TIMESTAMP NULL,
  last_heartbeat_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  deleted_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at_paranoid TIMESTAMP NULL COMMENT 'Paranoid delete timestamp',
  INDEX idx_phone (phone),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
