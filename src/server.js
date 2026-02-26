const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const healthRoutes = require('./api/routes/health');
const messageRoutes = require('./api/routes/messages');
const connectionRoutes = require('./api/routes/connections');
const jobs = require('./jobs');
const redis = require('./config/redis');
const databaseInit = require('./config/database-init');
const sequelize = require('./config/sequelize');
const messageService = require('./services/messageService');
const baileysService = require('./services/baileysService');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api', healthRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', connectionRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WhatsApp Gateway API',
    version: config.app.version,
    environment: config.app.env,
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

app.use(errorHandler);

const PORT = config.app.port;

const startServer = async () => {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await databaseInit.initialize();
    logger.info('Database initialization completed');

    // Initialize Redis
    logger.info('Initializing Redis...');
    await redis.initializeClient();
    logger.info('Redis initialization completed');

    // Initialize background jobs
    const queue = await jobs.init({ messageService });
    messageService.configure({ queue, baileysService });
    baileysService.setIncomingHandler(async (phone, message) => {
      await messageService.handleIncomingMessage(phone, message);
    });

    // Initialize WhatsApp connections (database records first, env values as fallback)
    await baileysService.initializeConnections();
    logger.info('Background jobs initialized');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`${config.app.version} server running`, {
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
  await jobs.close();
  await baileysService.closeAll();
  await sequelize.close();
  await redis.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await jobs.close();
  await baileysService.closeAll();
  await sequelize.close();
  await redis.close();
  process.exit(0);
});

module.exports = app;
