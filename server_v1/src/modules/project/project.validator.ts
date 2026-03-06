/**
 * @file modules/project/project.validator.ts
 * @description Zod schemas for the Projects module.
 */

import { z } from 'zod';
import { PROJECT_STATUSES } from '@models/index';

// ─── Shared ───────────────────────────────────────────────────────────────────

const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID — must be a 24-character hex string');

// ─── Create ───────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name must be at most 150 characters'),
  code: z
    .string({ required_error: 'Project code is required' })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9\-]{2,20}$/, 'Code must be 2–20 uppercase alphanumeric characters or dashes'),
  description: z.string().trim().max(2000).optional().default(''),
  clientId:    mongoId,
  budget: z
    .number({ invalid_type_error: 'Budget must be a number' })
    .min(0, 'Budget cannot be negative')
    .default(0),
  members:   z.array(mongoId).optional().default([]),
  status:    z.enum(PROJECT_STATUSES).optional().default('active'),
  startDate: z.string().datetime().nullable().optional(),
  endDate:   z.string().datetime().nullable().optional(),
}).refine(
  (d) => {
    if (!d.startDate || !d.endDate) return true;
    return new Date(d.endDate) >= new Date(d.startDate);
  },
  { message: 'End date must be on or after start date', path: ['endDate'] },
);

export type CreateProjectBody = z.infer<typeof createProjectSchema>;

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateProjectSchema = z.object({
  name:        z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(2000).optional(),
  budget:      z.number().min(0).optional(),
  status:      z.enum(PROJECT_STATUSES).optional(),
  startDate:   z.string().datetime().nullable().optional(),
  endDate:     z.string().datetime().nullable().optional(),
  isActive:    z.boolean().optional(),
}).strict();

export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;

// ─── List query ───────────────────────────────────────────────────────────────

export const listProjectsQuerySchema = z.object({
  status:   z.enum(PROJECT_STATUSES).optional(),
  clientId: mongoId.optional(),
  memberId: mongoId.optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search:   z.string().trim().optional(),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().positive().max(100).default(20),
  sortBy:   z.enum(['name', 'code', 'budget', 'startDate', 'status']).default('name'),
  order:    z.enum(['asc', 'desc']).default('asc'),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

// ─── Params ───────────────────────────────────────────────────────────────────

export const projectParamsSchema = z.object({ id: mongoId });
export type ProjectParams = z.infer<typeof projectParamsSchema>;

// ─── Member ops ───────────────────────────────────────────────────────────────

export const memberBodySchema = z.object({
  userId: mongoId,
});
export type MemberBody = z.infer<typeof memberBodySchema>;
