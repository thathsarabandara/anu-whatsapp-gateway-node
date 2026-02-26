/**
 * Contact Model - Sequelize ORM
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    index: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  lmsUserId: {
    type: DataTypes.STRING(100),
    field: 'lms_user_id',
    allowNull: true,
    index: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  totalMessagesSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_messages_sent',
  },
  totalMessagesReceived: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_messages_received',
  },
  firstSeen: {
    type: DataTypes.DATE,
    field: 'first_seen',
    defaultValue: DataTypes.NOW,
  },
  lastSeen: {
    type: DataTypes.DATE,
    field: 'last_seen',
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'contacts',
  timestamps: true,
  underscored: true,
});

module.exports = Contact;
