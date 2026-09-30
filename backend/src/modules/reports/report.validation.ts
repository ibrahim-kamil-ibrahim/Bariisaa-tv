import { z } from 'zod';

export const reportQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
});
