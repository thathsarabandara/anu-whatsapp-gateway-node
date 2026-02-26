/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/no-extraneous-dependencies
const qrcode = require('qrcode-terminal');
const config = require('../config/config');
const logger = require('../utils/logger');
const CredentialService = require('./credentialService');

class BaileysService {
  constructor() {
    this.connections = new Map();
    this.states = new Map();
    this.registrationSessions = new Map();
    this.intentionalDisconnects = new Set();
    this.isShuttingDown = false;
    this.incomingHandler = null;
    this.sdk = null;
    this.isReady = false;
  }

  async ensureSdk() {
    if (this.isReady && this.sdk) {
      return;
    }

    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const baileysModule = await import('@whiskeysockets/baileys');
      this.sdk = baileysModule;
      this.isReady = Boolean(baileysModule.default);
    } catch (error) {
      this.isReady = false;
      logger.warn('Baileys package is unavailable. Install @whiskeysockets/baileys to enable WhatsApp connectivity.');
    }
  }

  setIncomingHandler(handler) {
    this.incomingHandler = handler;
  }

  async initializeConnections(phones = []) {
    await this.ensureSdk();

    if (!this.isReady) {
      logger.warn('Skipping Baileys initialization because package is unavailable');
      return [];
    }

    const dbPhones = await CredentialService.getRegisteredPhones();
    const fallbackPhones = [
      config.whatsapp.phonePrimary,
      ...config.whatsapp.phonesBackup,
    ].filter(Boolean);
    const inputPhones = phones.filter(Boolean);
    const uniquePhones = [...new Set([...dbPhones, ...inputPhones, ...fallbackPhones])];

    await Promise.all(uniquePhones.map((phone) => CredentialService.ensurePhoneRecord(phone)));

    const results = await Promise.allSettled(
      uniquePhones.map((phone) => this.createConnection(phone, { method: 'qr' })),
    );

    return uniquePhones.filter((phone, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        return true;
      }

      logger.error('Failed to initialize connection', {
        phone,
        error: result.reason?.message || 'Unknown error',
      });
      return false;
    });
  }

  async createConnection(phone, options = {}) {
    await this.ensureSdk();

    if (!this.isReady) {
      throw new Error('Baileys package unavailable');
    }

    const makeWASocket = this.sdk.default;
    const {
      DisconnectReason,
      fetchLatestBaileysVersion,
      Browsers,
      initAuthCreds,
    } = this.sdk;
    const { method = 'qr' } = options;

    const storedCredentials = await CredentialService.loadCredentials(phone);
    const keyStore = storedCredentials?.keys || {};

    const state = {
      creds: storedCredentials?.creds || initAuthCreds(),
      keys: {
        get: async (type, ids) => {
          const values = {};

          ids.forEach((id) => {
            const key = `${type}:${id}`;
            values[id] = keyStore[key];
          });

          return values;
        },
        set: async (data) => {
          Object.keys(data).forEach((type) => {
            Object.keys(data[type]).forEach((id) => {
              const value = data[type][id];
              const key = `${type}:${id}`;

              if (value) {
                keyStore[key] = value;
              } else {
                delete keyStore[key];
              }
            });
          });

          await CredentialService.saveCredentials(phone, {
            creds: state.creds,
            keys: keyStore,
          });
        },
      },
    };

    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      auth: state,
      browser: Browsers.ubuntu('WhatsApp Gateway'),
      syncFullHistory: config.whatsapp.syncFullHistory,
      markOnlineOnConnect: config.whatsapp.markOnline,
      connectTimeoutMs: config.whatsapp.connectionTimeout,
      generateHighQualityLinkPreview: false,
    });

    this.connections.set(phone, socket);
    this.states.set(phone, 'CONNECTING');
    this.registrationSessions.set(phone, {
      phone,
      method,
      status: 'CONNECTING',
      qr: null,
      pairingCode: null,
      updatedAt: new Date().toISOString(),
      error: null,
    });

    socket.ev.on('creds.update', async (credsUpdate) => {
      state.creds = {
        ...state.creds,
        ...credsUpdate,
      };

      try {
        await CredentialService.saveCredentials(phone, {
          creds: state.creds,
          keys: keyStore,
        });
      } catch (error) {
        logger.warn('Credential persistence failed', { phone, error: error.message });
      }
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrcode.generate(qr, { small: true });
        logger.info('QR code generated. Scan it with WhatsApp > Linked devices.', { phone });

        const session = this.registrationSessions.get(phone) || {};
        this.registrationSessions.set(phone, {
          ...session,
          phone,
          method: session.method || method,
          status: 'AWAITING_QR_SCAN',
          qr,
          updatedAt: new Date().toISOString(),
          error: null,
        });
      }

      if (connection === 'open') {
        this.intentionalDisconnects.delete(phone);
        this.states.set(phone, 'CONNECTED');
        await CredentialService.updateConnectionStatus(phone, 'CONNECTED', 'CONNECTED');
        const session = this.registrationSessions.get(phone) || {};
        this.registrationSessions.set(phone, {
          ...session,
          status: 'CONNECTED',
          qr: null,
          updatedAt: new Date().toISOString(),
          error: null,
        });
        logger.info('WhatsApp connection opened', { phone });
      }

      if (connection === 'close') {
        const isIntentionalClose = this.isShuttingDown || this.intentionalDisconnects.has(phone);

        this.states.set(phone, 'DISCONNECTED');
        if (!isIntentionalClose) {
          await CredentialService.updateConnectionStatus(phone, 'DISCONNECTED', 'DISCONNECTED');
        }
        const session = this.registrationSessions.get(phone) || {};
        this.registrationSessions.set(phone, {
          ...session,
          status: 'DISCONNECTED',
          updatedAt: new Date().toISOString(),
          error: lastDisconnect?.error?.message || null,
        });

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = !isIntentionalClose && statusCode !== DisconnectReason.loggedOut;

        if (isIntentionalClose) {
          this.intentionalDisconnects.delete(phone);
        }

        if (shouldReconnect) {
          logger.warn('Connection closed, scheduling reconnect', { phone, statusCode });
          setTimeout(() => {
            this.createConnection(phone).catch((error) => {
              logger.error('Reconnection failed', { phone, error: error.message });
            });
          }, 5000);
        }
      }
    });

    socket.ev.on('messages.upsert', async (event) => {
      if (event.type !== 'notify' || !this.incomingHandler) {
        return;
      }

      const tasks = event.messages.map(async (message) => {
        try {
          await this.incomingHandler(phone, message);
        } catch (error) {
          logger.error('Incoming handler failed', { error: error.message, phone });
        }
      });

      await Promise.all(tasks);
    });

    if (method === 'pairing_code' && typeof socket.requestPairingCode === 'function') {
      const pairingCode = await socket.requestPairingCode(phone);
      const session = this.registrationSessions.get(phone) || {};
      this.registrationSessions.set(phone, {
        ...session,
        status: 'AWAITING_PAIRING',
        pairingCode,
        updatedAt: new Date().toISOString(),
        error: null,
      });
    }

    return socket;
  }

  async registerPhone({ phone, method = 'qr' }) {
    this.isShuttingDown = false;

    await CredentialService.ensurePhoneRecord(phone);
    await CredentialService.resetCredentials(phone);

    const existing = this.connections.get(phone);
    if (existing) {
      this.intentionalDisconnects.add(phone);
      try {
        await existing.logout();
      } catch (error) {
        logger.warn('Failed to logout existing phone session', { phone, error: error.message });
      } finally {
        this.intentionalDisconnects.delete(phone);
      }
      this.connections.delete(phone);
      this.states.delete(phone);
    }

    await this.createConnection(phone, { method });
    return this.getRegistrationStatus(phone);
  }

  getRegistrationStatus(phone) {
    const session = this.registrationSessions.get(phone);
    const state = this.states.get(phone) || 'DISCONNECTED';

    return {
      phone,
      state,
      connected: state === 'CONNECTED',
      registration: session || {
        phone,
        status: state,
        method: null,
        qr: null,
        pairingCode: null,
        updatedAt: null,
        error: null,
      },
    };
  }

  async disconnectPhone(phone) {
    const socket = this.connections.get(phone);
    if (!socket) {
      return false;
    }

    this.intentionalDisconnects.add(phone);
    try {
      await socket.logout();
    } finally {
      this.intentionalDisconnects.delete(phone);
    }
    this.connections.delete(phone);
    this.states.delete(phone);
    await CredentialService.updateConnectionStatus(phone, 'DISCONNECTED', 'DISCONNECTED');
    return true;
  }

  async sendMessage(toPhone, content) {
    const connection = this.getActiveConnection();

    if (!connection) {
      throw new Error('No active WhatsApp connection');
    }

    const jid = `${toPhone}@s.whatsapp.net`;
    const result = await connection.sendMessage(jid, { text: content });

    return {
      whatsappMessageId: result?.key?.id || null,
      timestamp: result?.messageTimestamp || Date.now(),
    };
  }

  getActiveConnection() {
    const connectedPhone = [...this.states.entries()].find(([, state]) => state === 'CONNECTED');
    if (!connectedPhone) return null;
    return this.connections.get(connectedPhone[0]);
  }

  getConnectionStatus() {
    return [...this.states.entries()].map(([phone, status]) => ({
      phone,
      status,
      connected: status === 'CONNECTED',
    }));
  }

  async closeAll() {
    this.isShuttingDown = true;

    const sockets = [...this.connections.entries()];
    const closeTasks = sockets.map(async ([phone, socket]) => {
      this.intentionalDisconnects.add(phone);
      try {
        if (typeof socket.end === 'function') {
          await socket.end(new Error('Service shutdown'));
        } else if (socket.ws && typeof socket.ws.close === 'function') {
          socket.ws.close();
        }
      } catch (error) {
        logger.warn('Failed to close socket cleanly', { error: error.message });
      } finally {
        this.intentionalDisconnects.delete(phone);
      }
    });

    await Promise.all(closeTasks);
    this.connections.clear();
    this.states.clear();
    this.isShuttingDown = false;
  }
}

module.exports = new BaileysService();
