const request = require('supertest');
const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');

describe('Async Handler Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  it('should handle successful async function', async () => {
    const mockHandler = jest.fn().mockResolvedValue(undefined);
    const route = asyncHandler(mockHandler);

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await route(req, res, next);

    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
  });

  it('should catch errors from async function', async () => {
    const error = new Error('Test error');
    const mockHandler = jest.fn().mockRejectedValue(error);
    const route = asyncHandler(mockHandler);

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await route(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should work with Express routes', async () => {
    app.get('/test', asyncHandler(async (req, res) => {
      res.json({ message: 'success' });
    }));

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'success' });
  });
});
