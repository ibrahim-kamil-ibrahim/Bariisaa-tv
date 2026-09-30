import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.record(z.array(z.string())).optional(),
  permissionIds: z.array(z.string()).optional(),
});
