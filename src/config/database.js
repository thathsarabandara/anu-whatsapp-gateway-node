const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'whatsapp_gateway',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
  queueLimit: 0,
  timezone: '+00:00',
  dateStrings: true,
};

let pool = null;

/**
 * Initialize database pool
 */
const initializePool = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    logger.info('Database connection pool created successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error('Failed to initialize database pool', { error: error.message });
    throw error;
  }
};

/**
 * Get database connection from pool
 */
const getConnection = async () => {
  if (!pool) {
    await initializePool();
  }
  return pool.getConnection();
};

/**
 * Execute query
 */
const query = async (sql, values) => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

/**
 * Close all connections in pool
 */
const close = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
};

module.exports = {
  pool: () => pool,
  initializePool,
  getConnection,
  query,
  close,
};
