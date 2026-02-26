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
    it('should create users table', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([]),
      };

      await databaseInit.initializeTables(mockConnection);

      expect(mockConnection.execute).toHaveBeenCalled();
      const { mock: { calls } } = mockConnection.execute;
      expect(calls.some(([sql]) => sql.includes('users'))).toBe(true);
    });

    it('should create messages table', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([]),
      };

      await databaseInit.initializeTables(mockConnection);

      const { mock: { calls } } = mockConnection.execute;
      expect(calls.some(([sql]) => sql.includes('messages'))).toBe(true);
    });

    it('should create webhooks table', async () => {
      const mockConnection = {
        execute: jest.fn().mockResolvedValue([]),
      };

      await databaseInit.initializeTables(mockConnection);

      const { mock: { calls } } = mockConnection.execute;
      expect(calls.some(([sql]) => sql.includes('webhooks'))).toBe(true);
    });

    it('should handle table creation errors', async () => {
      const mockConnection = {
        execute: jest.fn().mockRejectedValue(new Error('Table error')),
      };

      await expect(databaseInit.initializeTables(mockConnection)).rejects.toThrow();
    });
  });
});
