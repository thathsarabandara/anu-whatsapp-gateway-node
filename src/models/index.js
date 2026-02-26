/**
 * Models directory
 * Export all database models from this single entry point
 */

const Message = require('./Message');
const Contact = require('./Contact');
const Conversation = require('./Conversation');
const RateLimit = require('./RateLimit');
const WebhookHistory = require('./WebhookHistory');
const QueueJob = require('./QueueJob');
const WhatsAppCredential = require('./WhatsAppCredential');

module.exports = {
  Message,
  Contact,
  Conversation,
  RateLimit,
  WebhookHistory,
  QueueJob,
  WhatsAppCredential,
};
