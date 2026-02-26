jest.mock('../../config/sequelize', () => ({
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn(),
}));

jest.mock('../../models', () => ({}));

const sequelize = require('../../config/sequelize');
const databaseInit = require('../../config/database-init');

describe('Database Initialization (Sequelize ORM)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(databaseInit).toBeDefined();
  });

  it('should expose initialize method', () => {
    expect(typeof databaseInit.initialize).toBe('function');
  });

  it('should authenticate and sync with default options', async () => {
    sequelize.authenticate.mockResolvedValue();
    sequelize.sync.mockResolvedValue();

    const result = await databaseInit.initialize();

    expect(result).toBe(true);
    expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
    expect(sequelize.sync).toHaveBeenCalledWith({ force: false, alter: false });
  });

  it('should pass custom sync options', async () => {
    sequelize.authenticate.mockResolvedValue();
    sequelize.sync.mockResolvedValue();

    await databaseInit.initialize({ force: true, alter: false });

    expect(sequelize.sync).toHaveBeenCalledWith({ force: true, alter: false });
  });

  it('should throw when authentication fails', async () => {
    sequelize.authenticate.mockRejectedValue(new Error('Auth failed'));

    await expect(databaseInit.initialize()).rejects.toThrow('Auth failed');
    expect(sequelize.sync).not.toHaveBeenCalled();
  });

  it('should throw when sync fails', async () => {
    sequelize.authenticate.mockResolvedValue();
    sequelize.sync.mockRejectedValue(new Error('Sync failed'));

    await expect(databaseInit.initialize()).rejects.toThrow('Sync failed');
  });
});
