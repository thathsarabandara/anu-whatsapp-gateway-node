const request = require('supertest');
const express = require('express');

describe('Health Check Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock health route
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to WhatsApp Gateway API',
        version: '1.0.0',
        environment: 'test',
        timestamp: new Date().toISOString(),
      });
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('ok');
    });

    it('should return timestamp', async () => {
      const res = await request(app).get('/api/health');

      expect(res.body).toHaveProperty('timestamp');
      expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Welcome');
    });

    it('should include version and environment', async () => {
      const res = await request(app).get('/');

      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
    });

    it('should have correct content type', async () => {
      const res = await request(app).get('/');

      expect(res.type).toBe('application/json');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent route', async () => {
      const res = await request(app).get('/non-existent');

      expect(res.statusCode).toBe(404);
    });
  });
});
