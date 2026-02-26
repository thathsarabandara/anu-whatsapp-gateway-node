const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const baileysService = require('../../services/baileysService');
const validators = require('../../utils/validators');

const router = express.Router();

router.get('/connections', asyncHandler(async (req, res) => {
  const connections = baileysService.getConnectionStatus();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      total: connections.length,
      active: connections.filter((item) => item.connected).length,
      connections,
    },
  });
}));

router.post('/connections/register', asyncHandler(async (req, res) => {
  const {
    phone,
    method = 'qr',
  } = req.body;

  const phoneValidation = validators.validatePhoneNumber(phone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: phoneValidation.error,
    });
  }

  if (!['qr', 'pairing_code'].includes(method)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid method. Use qr or pairing_code',
    });
  }

  const result = await baileysService.registerPhone({
    phone: phoneValidation.formatted,
    method,
  });

  return res.status(202).json({
    success: true,
    statusCode: 202,
    message: 'Phone registration started',
    data: result,
  });
}));

router.get('/connections/register/:phone/status', asyncHandler(async (req, res) => {
  const phoneValidation = validators.validatePhoneNumber(req.params.phone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: phoneValidation.error,
    });
  }

  const result = baileysService.getRegistrationStatus(phoneValidation.formatted);
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
  });
}));

router.post('/connections/:phone/disconnect', asyncHandler(async (req, res) => {
  const phoneValidation = validators.validatePhoneNumber(req.params.phone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: phoneValidation.error,
    });
  }

  const disconnected = await baileysService.disconnectPhone(phoneValidation.formatted);
  if (!disconnected) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: 'Connection not found for phone',
    });
  }

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Connection disconnected',
  });
}));

module.exports = router;
