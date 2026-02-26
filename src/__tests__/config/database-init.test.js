const databaseInit = require('../../config/database-init');

jest.mock('../../config/database');

describe('Database Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(databaseInit).toBeDefined();
  });

  it('should have createDatabaseIfNotExists method', () => {
    expect(typeof databaseInit.createDatabaseIfNotExists).toBe('function');
  });

  it('should have initializeTables method', () => {
    expect(typeof databaseInit.initializeTables).toBe('function');
  });

  it('should have initialize method', () => {
    expect(typeof databaseInit.initialize).toBe('function');
  });

  describe('initializeTables', () => {
    it('should create contacts table', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([]),
      };

      await databaseInit.initializeTables(mockConnection);

      expect(mockConnection.execute).toHaveBeenCalled();
      const { mock: { calls } } = mockConnection.execute;
      expect(calls.some(([sql]) => sql.includes('contacts'))).toBe(true);
    });

    it('should create messages table', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([]),
      };

      await databaseInit.initializeTables(mockConnection);

      const { mock: { calls } } = mockConnection.execute;
      expect(calls.some(([sql]) => sql.includes('messages'))).toBe(true);
    });

    it('should create webhooks history table', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([]),
      };

      await databaseInit.initializeTables(mockConnection);

      const { mock: { calls } } = mockConnection.execute;
      expect(calls.some(([sql]) => sql.includes('webhooks_history'))).toBe(true);
    });

    it('should create all expected tables', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([]),
      };

      await databaseInit.initializeTables(mockConnection);

      expect(mockConnection.execute).toHaveBeenCalledTimes(7);
      const executedSql = mockConnection.execute.mock.calls.map(([sql]) => sql).join(' ');

      expect(executedSql).toContain('messages');
      expect(executedSql).toContain('contacts');
      expect(executedSql).toContain('conversations');
      expect(executedSql).toContain('rate_limits');
      expect(executedSql).toContain('webhooks_history');
      expect(executedSql).toContain('queue_jobs');
      expect(executedSql).toContain('whatsapp_credentials');
    });

    it('should handle table creation errors', async () => {
      const mockConnection = {
        execute: jest.fn().mockRejectedValue(new Error('Table error')),
      };

      await expect(databaseInit.initializeTables(mockConnection)).rejects.toThrow();
    });
  });
});
