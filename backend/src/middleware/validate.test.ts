/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { validate } from './validate';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const createRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validate middleware (zod)', () => {
  it('calls next() and replaces req.body with parsed data on success', () => {
    const req: any = { body: { email: 'user@naik.com', password: 'StrongPass1!' } };
    const res = createRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'user@naik.com', password: 'StrongPass1!' });
  });

  it('returns 422 with grouped field errors on failure', () => {
    const req: any = { body: { email: 'not-an-email', password: 'x' } };
    const res = createRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: expect.objectContaining({
          email: expect.any(Array),
          password: expect.any(Array),
        }),
      })
    );
  });

  it('validates req.query when source is query', () => {
    const req: any = { query: { page: '2' } };
    const res = createRes();
    const next = jest.fn();

    validate(z.object({ page: z.coerce.number() }), 'query')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.query).toEqual({ page: 2 });
  });

  it('validates req.params when source is params', () => {
    const req: any = { params: { id: 'abc-123' } };
    const res = createRes();
    const next = jest.fn();

    validate(z.object({ id: z.string().min(3) }), 'params')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
