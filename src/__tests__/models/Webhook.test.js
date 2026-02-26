const Webhook = require('../../models/Webhook');
const database = require('../../config/database');

jest.mock('../../config/database');
jest.mock('../../utils/logger');

describe('Webhook Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new webhook', async () => {
      const mockResult = { insertId: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Webhook.create(1, 'https://example.com/webhook', 'all');

      expect(database.query).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.webhookUrl).toBe('https://example.com/webhook');
    });

    it('should create webhook with default event type', async () => {
      const mockResult = { insertId: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Webhook.create(1, 'https://example.com/webhook');

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      database.query.mockRejectedValue(error);

      await expect(Webhook.create(1, 'https://example.com/webhook')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should find webhook by ID', async () => {
      const mockWebhook = { id: 1, user_id: 1, webhook_url: 'https://example.com/webhook' };
      database.query.mockResolvedValue([mockWebhook]);

      const result = await Webhook.findById(1);

      expect(database.query).toHaveBeenCalledWith('SELECT * FROM webhooks WHERE id = ?', [1]);
      expect(result).toEqual(mockWebhook);
    });

    it('should return null if webhook not found', async () => {
      database.query.mockResolvedValue([]);

      const result = await Webhook.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find active webhooks for user', async () => {
      const mockWebhooks = [{ id: 1, user_id: 1, is_active: 1 }];
      database.query.mockResolvedValue(mockWebhooks);

      const result = await Webhook.findByUserId(1, true);

      expect(database.query).toHaveBeenCalled();
      expect(result).toEqual(mockWebhooks);
    });

    it('should find all webhooks for user when isActive is false', async () => {
      const mockWebhooks = [
        { id: 1, user_id: 1, is_active: 1 },
        { id: 2, user_id: 1, is_active: 0 },
      ];
      database.query.mockResolvedValue(mockWebhooks);

      const result = await Webhook.findByUserId(1, false);

      expect(result).toEqual(mockWebhooks);
    });
  });

  describe('update', () => {
    it('should update webhook', async () => {
      const mockResult = { affectedRows: 1 };
      database.query.mockResolvedValue(mockResult);

      const updates = { webhook_url: 'https://new.example.com/webhook' };
      const result = await Webhook.update(1, updates);

      expect(database.query).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      database.query.mockRejectedValue(error);

      await expect(Webhook.update(1, { webhook_url: 'https://test.com' })).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('toggleStatus', () => {
    it('should toggle webhook status', async () => {
      const mockResult = { affectedRows: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Webhook.toggleStatus(1);

      expect(database.query).toHaveBeenCalledWith(
        'UPDATE webhooks SET is_active = NOT is_active WHERE id = ?',
        [1],
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle toggle errors', async () => {
      const error = new Error('Toggle failed');
      database.query.mockRejectedValue(error);

      await expect(Webhook.toggleStatus(1)).rejects.toThrow('Toggle failed');
    });
  });

  describe('delete', () => {
    it('should delete webhook', async () => {
      const mockResult = { affectedRows: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Webhook.delete(1);

      expect(database.query).toHaveBeenCalledWith('DELETE FROM webhooks WHERE id = ?', [1]);
      expect(result).toEqual(mockResult);
    });
  });
});
