const Message = require('../../models/Message');
const database = require('../../config/database');

jest.mock('../../config/database');
jest.mock('../../utils/logger');

describe('Message Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const mockResult = { insertId: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Message.create(1, 'Hello World', 'outbound', 'ext-123');

      expect(database.query).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.userId).toBe(1);
      expect(result.messageText).toBe('Hello World');
    });

    it('should create message without external ID', async () => {
      const mockResult = { insertId: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Message.create(1, 'Hello', 'inbound');

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      database.query.mockRejectedValue(error);

      await expect(Message.create(1, 'Hello', 'outbound')).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find message by ID', async () => {
      const mockMessage = {
        id: 1,
        user_id: 1,
        message_text: 'Hello',
        direction: 'outbound',
      };
      database.query.mockResolvedValue([mockMessage]);

      const result = await Message.findById(1);

      expect(database.query).toHaveBeenCalledWith('SELECT * FROM messages WHERE id = ?', [1]);
      expect(result).toEqual(mockMessage);
    });

    it('should return null if message not found', async () => {
      database.query.mockResolvedValue([]);

      const result = await Message.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find messages by user ID', async () => {
      const mockMessages = [
        { id: 1, user_id: 1, message_text: 'Hello' },
        { id: 2, user_id: 1, message_text: 'Hi there' },
      ];
      database.query.mockResolvedValue(mockMessages);

      const result = await Message.findByUserId(1);

      expect(database.query).toHaveBeenCalled();
      expect(result).toEqual(mockMessages);
    });

    it('should find messages with status filter', async () => {
      const mockMessages = [{ id: 1, user_id: 1, status: 'delivered' }];
      database.query.mockResolvedValue(mockMessages);

      const result = await Message.findByUserId(1, 'delivered', 50, 0);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('user_id = ?'),
        [1, 'delivered', 50, 0],
      );
      expect(result).toEqual(mockMessages);
    });

    it('should support pagination', async () => {
      const mockMessages = [];
      database.query.mockResolvedValue(mockMessages);

      await Message.findByUserId(1, null, 10, 20);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        [1, 10, 20],
      );
    });
  });

  describe('updateStatus', () => {
    it('should update message status', async () => {
      const mockResult = { affectedRows: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Message.updateStatus(1, 'delivered');

      expect(database.query).toHaveBeenCalledWith(
        'UPDATE messages SET status = ? WHERE id = ?',
        ['delivered', 1],
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      database.query.mockRejectedValue(error);

      await expect(Message.updateStatus(1, 'failed')).rejects.toThrow('Update failed');
    });
  });

  describe('getStatistics', () => {
    it('should get message statistics', async () => {
      const mockStats = [
        { direction: 'inbound', status: 'delivered', count: 5 },
        { direction: 'outbound', status: 'sent', count: 3 },
      ];
      database.query.mockResolvedValue(mockStats);

      const result = await Message.getStatistics(1);

      expect(database.query).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle statistics errors', async () => {
      const error = new Error('Query failed');
      database.query.mockRejectedValue(error);

      await expect(Message.getStatistics(1)).rejects.toThrow('Query failed');
    });
  });

  describe('delete', () => {
    it('should delete message', async () => {
      const mockResult = { affectedRows: 1 };
      database.query.mockResolvedValue(mockResult);

      const result = await Message.delete(1);

      expect(database.query).toHaveBeenCalledWith('DELETE FROM messages WHERE id = ?', [1]);
      expect(result).toEqual(mockResult);
    });
  });
});
