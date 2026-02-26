/**
 * RateLimit Model - Sequelize ORM
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { DataTypes } from 'sequelize';
import { define } from '../config/sequelize';

const RateLimit = define('RateLimit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    index: true,
  },
  messageType: {
    type: DataTypes.ENUM('OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL'),
    defaultValue: 'GENERAL',
    field: 'message_type',
  },
  limitCount: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    field: 'limit_count',
  },
  windowSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 3600,
    field: 'window_seconds',
  },
  currentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_count',
  },
  resetAt: {
    type: DataTypes.DATE,
    field: 'reset_at',
  },
}, {
  tableName: 'rate_limits',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['phone', 'message_type'],
      unique: true,
    },
  ],
});

export default RateLimit;
