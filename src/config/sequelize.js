/**
 * Sequelize Database Configuration
 */

const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: 30000,
      idle: 10000,
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: true,
  },
);

module.exports = sequelize;
