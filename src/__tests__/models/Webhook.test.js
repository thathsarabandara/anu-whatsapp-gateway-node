const WebhookHistory = require('../../models/WebhookHistory');

describe('WebhookHistory Model', () => {
  it('should be defined as a Sequelize model', () => {
    expect(WebhookHistory).toBeDefined();
    expect(WebhookHistory.name).toBe('WebhookHistory');
  });

  it('should map to webhooks_history table', () => {
    expect(WebhookHistory.getTableName()).toBe('webhooks_history');
  });

  it('should define required attributes', () => {
    const attrs = WebhookHistory.rawAttributes;

    expect(attrs.eventType.allowNull).toBe(false);
    expect(attrs.webhookUrl.allowNull).toBe(false);
  });

  it('should define defaults and field mappings', () => {
    const attrs = WebhookHistory.rawAttributes;

    expect(attrs.status.defaultValue).toBe('PENDING');
    expect(attrs.retryCount.defaultValue).toBe(0);
    expect(attrs.targetSystem.defaultValue).toBe('LMS');

    expect(attrs.messageId.field).toBe('message_id');
    expect(attrs.eventType.field).toBe('event_type');
    expect(attrs.webhookUrl.field).toBe('webhook_url');
    expect(attrs.retryCount.field).toBe('retry_count');
    expect(attrs.targetSystem.field).toBe('target_system');
    expect(attrs.responseData.field).toBe('response_data');
    expect(attrs.sentAt.field).toBe('sent_at');
  });

  it('should include expected status enum values', () => {
    const attrs = WebhookHistory.rawAttributes;

    expect(attrs.status.values).toEqual(['PENDING', 'SUCCESS', 'FAILED']);
  });
});
