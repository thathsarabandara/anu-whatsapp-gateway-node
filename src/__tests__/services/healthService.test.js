const HealthService = require('../../services/healthService');

describe('Health Service', () => {
  it('should be defined', () => {
    expect(HealthService).toBeDefined();
  });

  it('should have getHealth method', () => {
    expect(typeof HealthService.getHealth).toBe('function');
  });

  it('should return health status', async () => {
    const health = await HealthService.getHealth();

    expect(health).toBeDefined();
    expect(health.status).toBeDefined();
  });

  it('should have status property', async () => {
    const health = await HealthService.getHealth();

    expect(health.status).toMatch(/ok|healthy|up/i);
  });

  it('should include timestamp', async () => {
    const health = await HealthService.getHealth();

    expect(health.timestamp).toBeDefined();
  });
});
