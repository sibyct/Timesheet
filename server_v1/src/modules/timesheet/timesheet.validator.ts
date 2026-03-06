/**
 * @file modules/timesheet/timesheet.validator.ts
 * @description Zod schemas for the Timesheet module.
 */

import { z } from 'zod';
import { TIMESHEET_STATUSES } from '@models/timesheet.model';

// ─── Shared ───────────────────────────────────────────────────────────────────

const objectIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid ObjectId');

// ─── Create ───────────────────────────────────────────────────────────────────

/** Body schema for POST /timesheets */
export const createTimesheetSchema = z.object({
  periodStart: z
    .string({ required_error: 'Period start date is required' })
    .datetime({ message: 'periodStart must be a valid ISO 8601 date-time' }),
  periodEnd: z
    .string({ required_error: 'Period end date is required' })
    .datetime({ message: 'periodEnd must be a valid ISO 8601 date-time' }),
  notes: z.string().trim().max(2000, 'Notes must be at most 2000 characters').optional(),
}).refine(
  (data) => new Date(data.periodEnd) > new Date(data.periodStart),
  { message: 'Period end must be after period start', path: ['periodEnd'] },
);

export type CreateTimesheetBody = z.infer<typeof createTimesheetSchema>;

// ─── Update ───────────────────────────────────────────────────────────────────

/** Embedded entry payload for PATCH /timesheets/:id */
const timesheetEntryInputSchema = z.object({
  entryId:   objectIdSchema,
  projectId: objectIdSchema,
  taskId:    objectIdSchema,
  date: z
    .string({ required_error: 'Entry date is required' })
    .datetime({ message: 'date must be a valid ISO 8601 date-time' }),
  hours: z
    .number({ required_error: 'Hours are required' })
    .min(0.25, 'Minimum entry is 0.25 hours')
    .max(24, 'Cannot log more than 24 hours per entry'),
  isBillable: z.boolean(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']),
});

/** Body schema for PATCH /timesheets/:id */
export const updateTimesheetSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional(),
  entries: z
    .array(timesheetEntryInputSchema)
    .max(500, 'Cannot have more than 500 entries per timesheet')
    .optional(),
}).refine(
  (data) => data.notes !== undefined || data.entries !== undefined,
  { message: 'At least one of notes or entries must be provided' },
);

export type UpdateTimesheetBody = z.infer<typeof updateTimesheetSchema>;

// ─── List Query ───────────────────────────────────────────────────────────────

/** Query schema for GET /timesheets */
export const listTimesheetsQuerySchema = z.object({
  status: z.enum(TIMESHEET_STATUSES).optional(),
  userId: objectIdSchema.optional(), // admin/manager only
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['periodStart', 'submittedAt', 'totalHours', 'status']).default('periodStart'),
  order:  z.enum(['asc', 'desc']).default('desc'),
});

export type ListTimesheetsQuery = z.infer<typeof listTimesheetsQuerySchema>;

// ─── Params ───────────────────────────────────────────────────────────────────

export const timesheetParamsSchema = z.object({
  id: objectIdSchema,
});

export type TimesheetParams = z.infer<typeof timesheetParamsSchema>;

// ─── Reject ───────────────────────────────────────────────────────────────────

/** Body schema for POST /timesheets/:id/reject */
export const rejectTimesheetSchema = z.object({
  reason: z
    .string({ required_error: 'Rejection reason is required' })
    .trim()
    .min(1, 'Rejection reason cannot be empty')
    .max(1000, 'Rejection reason must be at most 1000 characters'),
});

export type RejectTimesheetBody = z.infer<typeof rejectTimesheetSchema>;

// ─── Bulk Approve ─────────────────────────────────────────────────────────────

/** Body schema for POST /timesheets/bulk-approve */
export const bulkApproveSchema = z.object({
  ids: z
    .array(objectIdSchema, { required_error: 'ids array is required' })
    .min(1, 'At least one ID is required')
    .max(100, 'Cannot bulk-approve more than 100 timesheets at once'),
});

export type BulkApproveBody = z.infer<typeof bulkApproveSchema>;
