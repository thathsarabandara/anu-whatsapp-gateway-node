const Message = require('../../models/Message');

describe('Message Model', () => {
  it('should be defined as a Sequelize model', () => {
    expect(Message).toBeDefined();
    expect(Message.name).toBe('Message');
  });

  it('should map to messages table', () => {
    expect(Message.getTableName()).toBe('messages');
  });

  it('should define required attributes and defaults', () => {
    const attrs = Message.rawAttributes;

    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs.toPhone.allowNull).toBe(false);
    expect(attrs.fromPhone.allowNull).toBe(false);
    expect(attrs.body.allowNull).toBe(false);

    expect(attrs.messageType.defaultValue).toBe('GENERAL');
    expect(attrs.status.defaultValue).toBe('QUEUED');
    expect(attrs.priority.defaultValue).toBe('NORMAL');
    expect(attrs.retryCount.defaultValue).toBe(0);
  });

  it('should have expected field mappings', () => {
    const attrs = Message.rawAttributes;

    expect(attrs.toPhone.field).toBe('to_phone');
    expect(attrs.fromPhone.field).toBe('from_phone');
    expect(attrs.conversationId.field).toBe('conversation_id');
    expect(attrs.lmsUserId.field).toBe('lms_user_id');
    expect(attrs.errorReason.field).toBe('error_reason');
    expect(attrs.retryCount.field).toBe('retry_count');
    expect(attrs.sentAt.field).toBe('sent_at');
    expect(attrs.deliveredAt.field).toBe('delivered_at');
  });

  it('should include expected ENUM values', () => {
    const attrs = Message.rawAttributes;

    expect(attrs.messageType.values).toEqual(['OTP', 'NOTIFICATION', 'CHATBOT', 'GENERAL']);
    expect(attrs.status.values).toEqual(['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED']);
    expect(attrs.direction.values).toEqual(['INBOUND', 'OUTBOUND']);
    expect(attrs.priority.values).toEqual(['LOW', 'NORMAL', 'HIGH']);
  });
});
