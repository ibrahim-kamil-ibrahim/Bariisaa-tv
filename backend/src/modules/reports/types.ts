import { z } from 'zod';
import { reportQuerySchema } from './report.validation';

export type ReportQueryDto = z.infer<typeof reportQuerySchema>;
