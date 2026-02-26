/**
 * WhatsAppCredential Model - Sequelize ORM
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const encryption = require('../utils/encryption');

const WhatsAppCredential = sequelize.define('WhatsAppCredential', {
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
  credentials: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const value = this.getDataValue('credentials');
      if (value) {
        try {
          return encryption.decryptObject(value);
        } catch (error) {
          return null;
        }
      }
      return null;
    },
    set(value) {
      if (value === null) {
        this.setDataValue('credentials', null);
        return;
      }

      if (value) {
        this.setDataValue('credentials', encryption.encryptObject(value));
      }
    },
  },
  status: {
    type: DataTypes.ENUM('CONNECTED', 'DISCONNECTED', 'DELETED'),
    defaultValue: 'DISCONNECTED',
    index: true,
  },
  connectionStatus: {
    type: DataTypes.ENUM('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'RECONNECTING'),
    defaultValue: 'DISCONNECTED',
    field: 'connection_status',
  },
  batteryLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'battery_level',
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'device_info',
  },
  firstConnectedAt: {
    type: DataTypes.DATE,
    field: 'first_connected_at',
    allowNull: true,
  },
  lastHeartbeatAt: {
    type: DataTypes.DATE,
    field: 'last_heartbeat_at',
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at',
    allowNull: true,
  },
  deletedReason: {
    type: DataTypes.STRING(500),
    field: 'deleted_reason',
    allowNull: true,
  },
}, {
  tableName: 'whatsapp_credentials',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

module.exports = WhatsAppCredential;
