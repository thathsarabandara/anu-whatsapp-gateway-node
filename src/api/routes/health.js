const express = require('express');
const healthService = require('../../services/healthService');
const asyncHandler = require('../../middlewares/asyncHandler');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
  logger.debug('Health check initiated');
  const health = await healthService.checkHealth();
  res.status(200).json({
    success: true,
    data: health,
    message: 'API is healthy',
  });
}));

module.exports = router;
