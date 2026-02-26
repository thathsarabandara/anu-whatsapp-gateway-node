/**
 * Conversation Model - Sequelize ORM
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fromPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'from_phone',
  },
  toPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'to_phone',
    index: true,
  },
  contactId: {
    type: DataTypes.UUID,
    field: 'contact_id',
    index: true,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'CLOSED', 'ARCHIVED'),
    defaultValue: 'ACTIVE',
    index: true,
  },
  messageType: {
    type: DataTypes.ENUM('OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL'),
    defaultValue: 'GENERAL',
    field: 'message_type',
  },
  contextType: {
    type: DataTypes.STRING(50),
    field: 'context_type',
    allowNull: true,
  },
  contextData: {
    type: DataTypes.JSON,
    field: 'context_data',
    allowNull: true,
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'message_count',
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    field: 'last_message_at',
    defaultValue: DataTypes.NOW,
  },
  closedAt: {
    type: DataTypes.DATE,
    field: 'closed_at',
    allowNull: true,
  },
  closeReason: {
    type: DataTypes.STRING(500),
    field: 'close_reason',
    allowNull: true,
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  underscored: true,
});

module.exports = Conversation;
