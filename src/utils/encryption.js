/**
 * Encryption Utilities
 * Handles AES-256 encryption/decryption for sensitive data
 */

const crypto = require('crypto');
const config = require('../config/config');
const logger = require('./logger');

const binaryReplacer = (key, value) => {
  if (Buffer.isBuffer(value)) {
    return {
      __binaryType: 'Buffer',
      data: value.toString('base64'),
    };
  }

  if (value instanceof Uint8Array) {
    return {
      __binaryType: 'Uint8Array',
      data: Buffer.from(value).toString('base64'),
    };
  }

  return value;
};

const binaryReviver = (key, value) => {
  if (value && value.__binaryType && value.data) {
    if (value.__binaryType === 'Buffer') {
      return Buffer.from(value.data, 'base64');
    }

    if (value.__binaryType === 'Uint8Array') {
      return Buffer.from(value.data, 'base64');
    }
  }

  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    return Buffer.from(value.data);
  }

  return value;
};

/**
 * Parse encryption key and IV from config (hex encoded)
 */
const getEncryptionParams = () => {
  try {
    const key = Buffer.from(config.security.encryptionKey, 'hex');
    const iv = Buffer.from(config.security.encryptionIV, 'hex');

    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }

    if (iv.length !== 16) {
      throw new Error('IV must be 16 bytes (128 bits)');
    }

    return { key, iv };
  } catch (error) {
    logger.error('Encryption configuration error', { error: error.message });
    throw error;
  }
};

/**
 * Encrypt data using AES-256-CBC
 * @param {string} plaintext - Data to encrypt
 * @returns {string} - Encrypted data as hex string
 */
const encrypt = (plaintext) => {
  try {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty');
    }

    const { key, iv } = getEncryptionParams();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  } catch (error) {
    logger.error('Encryption error', { error: error.message });
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encrypted - Encrypted data as hex string
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (encrypted) => {
  try {
    if (!encrypted) {
      throw new Error('Encrypted data cannot be empty');
    }

    const { key, iv } = getEncryptionParams();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error', { error: error.message });
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Encrypt JSON object
 * @param {object} data - Object to encrypt
 * @returns {string} - Encrypted data as hex string
 */
const encryptObject = (data) => {
  try {
    const jsonString = JSON.stringify(data, binaryReplacer);
    return encrypt(jsonString);
  } catch (error) {
    logger.error('Object encryption error', { error: error.message });
    throw error;
  }
};

/**
 * Decrypt JSON object
 * @param {string} encrypted - Encrypted data as hex string
 * @returns {object} - Decrypted object
 */
const decryptObject = (encrypted) => {
  try {
    const jsonString = decrypt(encrypted);
    return JSON.parse(jsonString, binaryReviver);
  } catch (error) {
    logger.error('Object decryption error', { error: error.message });
    throw error;
  }
};

/**
 * Generate hash for credential verification
 * @param {string} data - Data to hash
 * @returns {string} - SHA256 hash as hex string
 */
const generateHash = (data) => {
  try {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  } catch (error) {
    logger.error('Hash generation error', { error: error.message });
    throw error;
  }
};

/**
 * Verify data against hash
 * @param {string} data - Data to verify
 * @param {string} hash - Hash to compare against
 * @returns {boolean} - True if data matches hash
 */
const verifyHash = (data, hash) => {
  try {
    const computedHash = generateHash(data);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex'),
    );
  } catch (error) {
    logger.error('Hash verification error', { error: error.message });
    return false;
  }
};

/**
 * Generate random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Random token as hex string
 */
const generateToken = (length = 32) => {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    logger.error('Token generation error', { error: error.message });
    throw error;
  }
};

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  generateHash,
  verifyHash,
  generateToken,
  getEncryptionParams,
};
