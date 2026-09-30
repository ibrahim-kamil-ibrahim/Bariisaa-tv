import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
