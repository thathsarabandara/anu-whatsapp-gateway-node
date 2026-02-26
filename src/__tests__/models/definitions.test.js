const Conversation = require('../../models/Conversation');
const QueueJob = require('../../models/QueueJob');
const RateLimit = require('../../models/RateLimit');
const WhatsAppCredential = require('../../models/WhatsAppCredential');
const models = require('../../models');

describe('Additional Sequelize Model Definitions', () => {
  it('should expose expected tables for remaining models', () => {
    expect(Conversation.getTableName()).toBe('conversations');
    expect(QueueJob.getTableName()).toBe('queue_jobs');
    expect(RateLimit.getTableName()).toBe('rate_limits');
    expect(WhatsAppCredential.getTableName()).toBe('whatsapp_credentials');
  });

  it('should define enums and defaults for queue jobs', () => {
    const attrs = QueueJob.rawAttributes;

    expect(attrs.status.values).toEqual(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);
    expect(attrs.priority.values).toEqual(['LOW', 'NORMAL', 'HIGH']);
    expect(attrs.status.defaultValue).toBe('PENDING');
    expect(attrs.priority.defaultValue).toBe('NORMAL');
    expect(attrs.maxAttempts.defaultValue).toBe(3);
  });

  it('should define composite unique index for rate limits', () => {
    const indexFields = RateLimit.options.indexes.map((index) => index.fields.join(','));
    expect(indexFields).toContain('phone,message_type');
    expect(RateLimit.options.indexes[0].unique).toBe(true);
  });

  it('should define credential status enums', () => {
    const attrs = WhatsAppCredential.rawAttributes;
    expect(attrs.status.values).toEqual(['CONNECTED', 'DISCONNECTED', 'DELETED']);
    expect(attrs.connectionStatus.values).toEqual(['CONNECTED', 'DISCONNECTED', 'CONNECTING', 'RECONNECTING']);
    expect(attrs.connectionStatus.field).toBe('connection_status');
  });

  it('should export all models from index', () => {
    expect(models.Message).toBeDefined();
    expect(models.Contact).toBeDefined();
    expect(models.Conversation).toBeDefined();
    expect(models.RateLimit).toBeDefined();
    expect(models.WebhookHistory).toBeDefined();
    expect(models.QueueJob).toBeDefined();
    expect(models.WhatsAppCredential).toBeDefined();
  });
});
