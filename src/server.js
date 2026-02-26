const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const healthRoutes = require('./api/routes/health');
const jobs = require('./jobs');
const database = require('./config/database');
const redis = require('./config/redis');
const databaseInit = require('./config/database-init');

const app = express();

// ===============================
// Middleware Setup
// ===============================

// Security middleware
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ===============================
// Health Check Routes
// ===============================
app.use('/api', healthRoutes);

// ===============================
// Welcome Route
// ===============================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WhatsApp Gateway API',
    version: config.app.version,
    environment: config.app.env,
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ===============================
// Error Handler
// ===============================
app.use(errorHandler);

// ===============================
// Server Startup
// ===============================
const PORT = config.app.port;

const startServer = async () => {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await database.initializePool();
    const connection = await database.getConnection();
    await databaseInit.initialize(connection);
    connection.release();
    logger.info('Database initialization completed');

    // Initialize Redis
    logger.info('Initializing Redis...');
    await redis.initializeClient();
    logger.info('Redis initialization completed');

    // Initialize background jobs
    await jobs.init();
    logger.info('Background jobs initialized');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`${config.app.name} server running`, {
        port: PORT,
        environment: config.app.env,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.close();
  await redis.close();
  process.exit(0);
});

module.exports = app;
