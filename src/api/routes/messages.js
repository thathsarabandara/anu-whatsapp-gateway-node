/**
 * Message API Routes
 * Endpoints for sending, receiving, and tracking WhatsApp messages
 */

const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('../../middlewares/asyncHandler');
const validators = require('../../utils/validators');
const logger = require('../../utils/logger');
const Message = require('../../models/Message');

const router = express.Router();

/**
 * POST /api/messages/send
 * Send a message via WhatsApp
 * Body: {
 *   phone: string (required),
 *   content: string (required),
 *   messageType: string (optional),
 *   priority: string (optional),
 *   lmsContext: string (optional),
 *   lmsUserId: string (optional)
 * }
 */
router.post('/send', asyncHandler(async (req, res) => {
  const {
    phone,
    content,
    messageType = 'NOTIFICATION',
    priority = 'NORMAL',
    lmsUserId = null,
  } = req.body;

  // Validate inputs
  const phoneValidation = validators.validatePhoneNumber(phone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: phoneValidation.error,
    });
  }

  const contentValidation = validators.validateMessageContent(content);
  if (!contentValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: contentValidation.error,
    });
  }

  const messageTypeValidation = validators.validateMessageType(messageType);
  if (!messageTypeValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: messageTypeValidation.error,
    });
  }

  const priorityValidation = validators.validatePriority(priority);
  if (!priorityValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: priorityValidation.error,
    });
  }

  try {
    // Create message record
    const messageId = uuidv4();

    logger.info(`Message queued: ${messageId} to ${phone}`, {
      messageType,
      priority,
      lmsUserId,
    });

    return res.status(202).json({
      success: true,
      statusCode: 202,
      message: 'Message queued for sending',
      data: {
        messageId: messageId,
        phone,
        type: messageType,
        priority,
        status: 'QUEUED',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Failed to queue message: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to queue message',
      error: error.message,
    });
  }
}));

/**
 * GET /api/messages/status/:messageId
 * Get status of a message
 */
router.get('/status/:messageId', asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const uuidValidation = validators.validateUUID(messageId);
  if (!uuidValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid message ID format',
    });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Message not found',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        messageId: message.id,
        status: message.status,
        direction: message.direction,
        type: message.message_type,
        sentAt: message.sent_at,
        deliveredAt: message.delivered_at,
        readAt: message.read_at,
        errorMessage: message.error_message,
        errorCode: message.error_code,
      },
    });
  } catch (error) {
    logger.error(`Failed to get message status: ${error.message}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to get message status',
    });
  }
}));

/**
 * GET /api/messages
 * Get messages with pagination and filters
 * Query params: status, type, phone, limit, offset
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    status = null,
    type = null,
    phone = null,
    limit = 20,
    offset = 0,
  } = req.query;

  try {
    const messages = await Message.findAll({
      status,
      type,
      phone,
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: Math.max(parseInt(offset, 10) || 0, 0),
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: messages,
      pagination: {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (error) {
    logger.error(`Failed to get messages: ${error.message}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to get messages',
    });
  }
}));

/**
 * POST /api/messages/webhook
 * Receive incoming messages from WhatsApp
 * This endpoint processes messages received from Baileys socket
 */
router.post('/webhook', asyncHandler(async (req, res) => {
  const {
    fromPhone,
    content,
  } = req.body;

  if (!fromPhone || !content) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Missing required fields: fromPhone, content',
    });
  }

  try {
    const phoneValidation = validators.validatePhoneNumber(fromPhone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid phone number',
      });
    }

    // Create incoming message record
    const message = await Message.create(
      null,
      content,
      'inbound',
    );

    logger.info(`Incoming message from ${fromPhone}: ${content.substring(0, 50)}...`);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Message received and processed',
      data: {
        messageId: message.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Failed to process incoming message: ${error.message}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to process message',
    });
  }
}));

/**
 * DELETE /api/messages/:messageId
 * Delete a message
 */
router.delete('/:messageId', asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const uuidValidation = validators.validateUUID(messageId);
  if (!uuidValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid message ID format',
    });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Message not found',
      });
    }

    // Check if message can be deleted (only QUEUED messages)
    if (message.status !== 'QUEUED') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Only queued messages can be deleted',
      });
    }

    await Message.delete(messageId);

    logger.info(`Message deleted: ${messageId}`);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    logger.error(`Failed to delete message: ${error.message}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to delete message',
    });
  }
}));

module.exports = router;
