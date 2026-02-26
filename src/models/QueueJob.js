/**
 * QueueJob Model - Sequelize ORM
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const QueueJob = sequelize.define('QueueJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bullJobId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'bull_job_id',
    unique: true,
  },
  queueName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'queue_name',
    index: true,
  },
  jobType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'job_type',
  },
  jobData: {
    type: DataTypes.JSON,
    field: 'job_data',
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING',
    index: true,
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH'),
    defaultValue: 'NORMAL',
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    field: 'max_attempts',
  },
  result: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  error: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at',
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
    allowNull: true,
  },
}, {
  tableName: 'queue_jobs',
  timestamps: true,
  underscored: true,
});

module.exports = QueueJob;
