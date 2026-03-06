import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const objectIdRegex = /^[a-f\d]{24}$/i;

export const reportQuerySchema = z
  .object({
    from:      z.string().regex(dateRegex, 'Must be YYYY-MM-DD date'),
    to:        z.string().regex(dateRegex, 'Must be YYYY-MM-DD date'),
    userId:    z.string().regex(objectIdRegex, 'Invalid ObjectId').optional(),
    projectId: z.string().regex(objectIdRegex, 'Invalid ObjectId').optional(),
    status:    z.enum(['submitted', 'approved', 'all']).default('approved'),
  })
  .refine((d) => new Date(d.from) <= new Date(d.to), {
    message: '"from" must be on or before "to"',
    path:    ['from'],
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;
