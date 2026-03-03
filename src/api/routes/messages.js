const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const validators = require('../../utils/validators');
const messageService = require('../../services/messageService');

const router = express.Router();

router.post('/send', asyncHandler(async (req, res) => {
  const {
    phone,
    content,
    messageType = 'NOTIFICATION',
    priority = 'NORMAL',
    lmsContext = null,
    lmsUserId = null,
  } = req.body;

  const phoneValidation = validators.validatePhoneNumber(phone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: phoneValidation.error,
    });
  }

  // Use the normalised number (digits-only, international format) for all
  // downstream operations so that the WhatsApp JID is always well-formed.
  const normalizedPhone = phoneValidation.formatted;

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

  const result = await messageService.queueMessage({
    phone: normalizedPhone,
    content,
    messageType,
    priority,
    lmsContext,
    lmsUserId,
  });

  if (!result.success) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: result.error || 'Failed to queue message',
    });
  }

  return res.status(202).json({
    success: true,
    statusCode: 202,
    message: 'Message queued for sending',
    data: result,
  });
}));

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

  const message = await messageService.getMessageStatus(messageId);

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
    data: message,
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  const {
    status = null,
    type = null,
    phone = null,
    limit = 20,
    offset = 0,
  } = req.query;

  const messages = await messageService.listMessages({
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
      limit: parseInt(limit, 10) || 20,
      offset: parseInt(offset, 10) || 0,
    },
  });
}));

router.post('/webhook', asyncHandler(async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Missing required fields: phone, message',
    });
  }

  await messageService.handleIncomingMessage(phone, message);

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Incoming message processed',
  });
}));

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

  const result = await messageService.deleteQueuedMessage(messageId);

  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      statusCode: result.statusCode,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Message deleted successfully',
  });
}));

module.exports = router;
