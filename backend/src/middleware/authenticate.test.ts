/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';
import { mockPrisma } from '../../test/mocks/prisma.mock';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import { authenticate, optionalAuth } from './authenticate';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

const createRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeToken = (payload: Record<string, unknown>, expiresIn = '15m') =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn } as jwt.SignOptions);

describe('authenticate middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = createRes();
    next = jest.fn();
  });

  it('returns 401 when no Authorization header is present', async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Access token required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the header is not a Bearer token', async () => {
    req.headers.authorization = 'Basic abc123';

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    req.headers.authorization = 'Bearer not-a-real-token';

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid access token' })
    );
  });

  it('returns 401 for an expired token', async () => {
    req.headers.authorization = `Bearer ${makeToken({ userId: 'user-1' }, '-1h')}`;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Access token expired' })
    );
  });

  it('returns 401 when the user no longer exists', async () => {
    req.headers.authorization = `Bearer ${makeToken({ userId: 'user-404' })}`;
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User not found. Please login again.' })
    );
  });

  it('returns 403 when the user account is not ACTIVE', async () => {
    req.headers.authorization = `Bearer ${makeToken({ userId: 'user-1' })}`;
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: 'SUSPENDED',
      roles: [],
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Account is inactive or suspended' })
    );
  });

  it('attaches userId, roles and permissions and calls next() for an ACTIVE user', async () => {
    req.headers.authorization = `Bearer ${makeToken({ userId: 'user-1' })}`;
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: 'ACTIVE',
      roles: [
        {
          role: {
            name: 'editor',
            permissions: [
              { permission: { name: 'books:read' } },
              { permission: { name: 'books:update' } },
            ],
          },
        },
        {
          role: {
            name: 'viewer',
            permissions: [{ permission: { name: 'books:read' } }],
          },
        },
      ],
    });

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe('user-1');
    expect(req.userRoles).toEqual(['editor', 'viewer']);
    expect(req.userPermissions).toEqual(['books:read', 'books:update', 'books:read']);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
  });
});

describe('optionalAuth middleware', () => {
  let req: any;
  let next: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    next = jest.fn();
  });

  it('continues without setting userId when no header is present', () => {
    optionalAuth(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBeUndefined();
  });

  it('sets userId from a valid token', () => {
    req.headers.authorization = `Bearer ${makeToken({ userId: 'user-9' })}`;

    optionalAuth(req, {} as any, next);

    expect(req.userId).toBe('user-9');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('continues silently for an invalid token', () => {
    req.headers.authorization = 'Bearer garbage-token';

    optionalAuth(req, {} as any, next);

    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
