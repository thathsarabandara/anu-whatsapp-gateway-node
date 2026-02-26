const sequelize = require('./sequelize');
require('../models');
const logger = require('../utils/logger');

/**
 * Initialize database using Sequelize ORM models
 */
const initialize = async (options = {}) => {
  const {
    force = false,
    alter = false,
  } = options;

  try {
    await sequelize.authenticate();
    await sequelize.sync({ force, alter });
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
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      logger.error('Database initialization failed', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}

module.exports = {
  initialize,
};
