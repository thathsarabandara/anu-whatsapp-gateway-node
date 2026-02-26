/**
 * WebhookHistory Model - Sequelize ORM
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const WebhookHistory = sequelize.define('WebhookHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  messageId: {
    type: DataTypes.UUID,
    field: 'message_id',
    index: true,
    allowNull: true,
  },
  eventType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'event_type',
    index: true,
  },
  webhookUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'webhook_url',
  },
  payload: {
    type: DataTypes.LONGTEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
    defaultValue: 'PENDING',
    index: true,
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'retry_count',
  },
  targetSystem: {
    type: DataTypes.STRING(50),
    defaultValue: 'LMS',
    field: 'target_system',
  },
  responseData: {
    type: DataTypes.LONGTEXT,
    field: 'response_data',
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    field: 'sent_at',
    allowNull: true,
  },
}, {
  tableName: 'webhooks_history',
  timestamps: true,
  underscored: true,
});

module.exports = WebhookHistory;
