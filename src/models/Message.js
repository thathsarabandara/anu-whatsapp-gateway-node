/**
 * Message Model - Sequelize ORM
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  toPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'to_phone',
    index: true,
  },
  fromPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'from_phone',
    index: true,
  },
  conversationId: {
    type: DataTypes.UUID,
    field: 'conversation_id',
    index: true,
  },
  lmsUserId: {
    type: DataTypes.STRING(100),
    field: 'lms_user_id',
    index: true,
  },
  body: {
    type: DataTypes.LONGTEXT,
    allowNull: false,
  },
  messageType: {
    type: DataTypes.ENUM('OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL'),
    defaultValue: 'GENERAL',
    field: 'message_type',
  },
  status: {
    type: DataTypes.ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED'),
    defaultValue: 'QUEUED',
    index: true,
  },
  direction: {
    type: DataTypes.ENUM('INBOUND', 'OUTBOUND'),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH'),
    defaultValue: 'NORMAL',
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  errorReason: {
    type: DataTypes.TEXT,
    field: 'error_reason',
    allowNull: true,
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'retry_count',
  },
  sentAt: {
    type: DataTypes.DATE,
    field: 'sent_at',
    allowNull: true,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    field: 'delivered_at',
    allowNull: true,
  },
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
});

module.exports = Message;
