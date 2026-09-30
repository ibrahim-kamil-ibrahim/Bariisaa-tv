/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction } from 'express';
import { authorize, authorizeRoles } from './authorize';

const createRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize middleware (permissions)', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = createRes();
    next = jest.fn();
  });

  it('returns 401 when the request is not authenticated', () => {
    authorize('books:read')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Authentication required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('allows super_admin without any specific permission', () => {
    req.userPermissions = [];
    req.userRoles = ['super_admin'];

    authorize('anything:at:all')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows a user who has one of the required permissions', () => {
    req.userPermissions = ['books:read', 'books:update'];
    req.userRoles = ['editor'];

    authorize('books:read', 'books:delete')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when the user lacks the required permissions', () => {
    req.userPermissions = ['books:read'];
    req.userRoles = ['viewer'];

    authorize('books:delete')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Insufficient permissions' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorizeRoles middleware (roles)', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = createRes();
    next = jest.fn();
  });

  it('returns 401 when roles are missing', () => {
    authorizeRoles('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a user with one of the required roles', () => {
    req.userRoles = ['editor', 'viewer'];

    authorizeRoles('admin', 'editor')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when the user has none of the required roles', () => {
    req.userRoles = ['viewer'];

    authorizeRoles('admin', 'editor')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Insufficient role' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
