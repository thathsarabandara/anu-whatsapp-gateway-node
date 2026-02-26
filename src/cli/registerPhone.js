const logger = require('../utils/logger');
const validators = require('../utils/validators');
const databaseInit = require('../config/database-init');
const sequelize = require('../config/sequelize');
const baileysService = require('../services/baileysService');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.replace('--', '').split('=');
      parsed[key] = value || true;
    }
  });

  return parsed;
};

const run = async () => {
  const args = parseArgs();
  const { phone, method = 'qr' } = args;

  const phoneValidation = validators.validatePhoneNumber(phone);
  if (!phoneValidation.valid) {
    logger.error(phoneValidation.error);
    process.exit(1);
  }

  if (!['qr', 'pairing_code'].includes(method)) {
    logger.error('Invalid method. Use --method=qr or --method=pairing_code');
    process.exit(1);
  }

  try {
    await databaseInit.initialize();

    const registration = await baileysService.registerPhone({
      phone: phoneValidation.formatted,
      method,
    });

    logger.info('Phone registration started', {
      phone: phoneValidation.formatted,
      method,
      state: registration.state,
    });

    if (registration.registration?.pairingCode) {
      logger.info('Pairing code', { pairingCode: registration.registration.pairingCode });
    }

    if (method === 'qr') {
      logger.info('Scan QR shown in terminal WhatsApp logs to complete linking');
    }

    const maxAttempts = 120;
    await new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const status = baileysService.getRegistrationStatus(phoneValidation.formatted);

        if (status.connected) {
          logger.info('Phone registered and connected successfully', {
            phone: phoneValidation.formatted,
          });
          clearInterval(interval);
          resolve();
          return;
        }

        if (status.registration?.error) {
          logger.warn('Registration status', {
            phone: phoneValidation.formatted,
            status: status.registration.status,
            error: status.registration.error,
          });
        }

        attempts += 1;
        if (attempts >= maxAttempts) {
          logger.warn('Registration timeout reached. Check /api/connections for latest status.');
          clearInterval(interval);
          resolve();
        }
      }, 2000);
    });
  } catch (error) {
    logger.error('Failed to register phone', { error: error.message });
    process.exitCode = 1;
  } finally {
    await baileysService.closeAll();
    await sequelize.close();
  }
};

run();
