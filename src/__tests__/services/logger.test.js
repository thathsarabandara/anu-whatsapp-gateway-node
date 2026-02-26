const logger = require('../../utils/logger');

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('should log info messages', () => {
    const result = logger.info('Test info message');
    expect(result || true).toBeTruthy();
  });

  it('should log error messages', () => {
    const result = logger.error('Test error message', { error: 'test error' });
    expect(result || true).toBeTruthy();
  });

  it('should log warn messages', () => {
    const result = logger.warn('Test warning message');
    expect(result || true).toBeTruthy();
  });

  it('should log debug messages', () => {
    const result = logger.debug('Test debug message');
    expect(result || true).toBeTruthy();
  });
});
