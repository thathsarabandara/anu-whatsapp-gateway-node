const errorHandler = require('../../middlewares/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      originalUrl: '/api/test',
      method: 'GET',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should handle errors with status code', () => {
    const error = new Error('Test error');
    error.statusCode = 400;

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalled();
  });

  it('should default to 500 status code', () => {
    const error = new Error('Server error');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should return proper error response', () => {
    const error = new Error('Bad request');
    error.statusCode = 400;

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 400,
      message: 'Bad request',
    }));
  });

  it('should use default message for missing message', () => {
    const error = new Error();
    error.statusCode = 503;
    error.message = '';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Internal Server Error',
    }));
  });
});
