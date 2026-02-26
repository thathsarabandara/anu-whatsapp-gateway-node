const logger = require('../utils/logger');

class HealthService {
  /**
   * Check system health status
   * @returns {Promise<Object>} Health status
   */
  static async getHealth() {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
        },
      };

      return status;
    } catch (error) {
      logger.error('Health check failed', error);
      throw error;
    }
  }
}

module.exports = HealthService;
