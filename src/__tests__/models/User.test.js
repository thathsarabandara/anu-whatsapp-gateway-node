const Contact = require('../../models/Contact');

describe('Contact Model', () => {
  it('should be defined as a Sequelize model', () => {
    expect(Contact).toBeDefined();
    expect(Contact.name).toBe('Contact');
  });

  it('should map to contacts table', () => {
    expect(Contact.getTableName()).toBe('contacts');
  });

  it('should define required and optional fields', () => {
    const attrs = Contact.rawAttributes;

    expect(attrs.phone.allowNull).toBe(false);
    expect(attrs.phone.unique).toBe(true);
    expect(attrs.name.allowNull).toBe(true);
    expect(attrs.lmsUserId.allowNull).toBe(true);
  });

  it('should apply default values and field mappings', () => {
    const attrs = Contact.rawAttributes;

    expect(attrs.isActive.defaultValue).toBe(true);
    expect(attrs.totalMessagesSent.defaultValue).toBe(0);
    expect(attrs.totalMessagesReceived.defaultValue).toBe(0);

    expect(attrs.lmsUserId.field).toBe('lms_user_id');
    expect(attrs.isActive.field).toBe('is_active');
    expect(attrs.totalMessagesSent.field).toBe('total_messages_sent');
    expect(attrs.totalMessagesReceived.field).toBe('total_messages_received');
    expect(attrs.firstSeen.field).toBe('first_seen');
    expect(attrs.lastSeen.field).toBe('last_seen');
  });
});
