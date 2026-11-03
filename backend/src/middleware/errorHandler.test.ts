import { errorHandler } from './errorHandler';

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('errorHandler', () => {
  it('reports Prisma schema drift (P2022) with an actionable message', () => {
    const err = Object.assign(
      new Error('The column `users.username` does not exist in the current database.'),
      { name: 'PrismaClientKnownRequestError', code: 'P2022' }
    );
    const res = createResponse();

    errorHandler(err, { method: 'POST', originalUrl: '/api/v1/auth/login' } as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Database schema is out of date'),
      })
    );
  });

  it('keeps a bare 500 for truly unexpected errors', () => {
    const res = createResponse();

    errorHandler(
      new Error('something exploded'),
      { method: 'GET', originalUrl: '/api/v1/books' } as never,
      res as never,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'something exploded' })
    );
  });
});
