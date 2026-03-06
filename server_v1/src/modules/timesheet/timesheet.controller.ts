/**
 * @file modules/timesheet/timesheet.controller.ts
 * @description HTTP adapter for the Timesheet module.
 *
 * Routes served:
 *   POST   /timesheets                  → create
 *   GET    /timesheets                  → list
 *   GET    /timesheets/:id              → getById
 *   PATCH  /timesheets/:id              → update
 *   DELETE /timesheets/:id              → remove
 *   POST   /timesheets/:id/submit       → submit
 *   POST   /timesheets/:id/recall       → recall
 *   POST   /timesheets/:id/approve      → approve   (manager/admin only)
 *   POST   /timesheets/:id/reject       → reject    (manager/admin only)
 *   POST   /timesheets/bulk-approve     → bulkApprove (manager/admin only)
 */

import type { Request, Response } from 'express';
import { ApiResponse } from '@utils/ApiResponse';
import * as service from './timesheet.service';
import type {
  CreateTimesheetBody,
  UpdateTimesheetBody,
  ListTimesheetsQuery,
  TimesheetParams,
  RejectTimesheetBody,
  BulkApproveBody,
} from './timesheet.validator';

// ─── create ───────────────────────────────────────────────────────────────────

/** POST /timesheets */
export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateTimesheetBody;
  const timesheet = await service.createTimesheet(req.user!.id, body);
  ApiResponse.created(res, timesheet, 'Timesheet created');
}

// ─── list ─────────────────────────────────────────────────────────────────────

/** GET /timesheets */
export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListTimesheetsQuery;
  const { timesheets, meta } = await service.listTimesheets(
    req.user!.id,
    req.user!.role,
    query,
  );
  ApiResponse.paginated(res, timesheets, meta, 'Timesheets retrieved');
}

// ─── getById ──────────────────────────────────────────────────────────────────

/** GET /timesheets/:id */
export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as TimesheetParams;
  const timesheet = await service.getTimesheetById(id, req.user!.id, req.user!.role);
  ApiResponse.ok(res, timesheet, 'Timesheet retrieved');
}

// ─── update ───────────────────────────────────────────────────────────────────

/** PATCH /timesheets/:id */
export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as TimesheetParams;
  const body = req.body as UpdateTimesheetBody;
  const timesheet = await service.updateTimesheet(id, req.user!.id, body);
  ApiResponse.ok(res, timesheet, 'Timesheet updated');
}

// ─── remove ───────────────────────────────────────────────────────────────────

/** DELETE /timesheets/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as TimesheetParams;
  await service.deleteTimesheet(id, req.user!.id);
  ApiResponse.noContent(res);
}

// ─── submit ───────────────────────────────────────────────────────────────────

/** POST /timesheets/:id/submit */
export async function submit(req: Request, res: Response): Promise<void> {
  const { id } = req.params as TimesheetParams;
  const timesheet = await service.submitTimesheet(id, req.user!.id);
  ApiResponse.ok(res, timesheet, 'Timesheet submitted for approval');
}

// ─── recall ───────────────────────────────────────────────────────────────────

/** POST /timesheets/:id/recall */
export async function recall(req: Request, res: Response): Promise<void> {
  const { id } = req.params as TimesheetParams;
  const timesheet = await service.recallTimesheet(id, req.user!.id);
  ApiResponse.ok(res, timesheet, 'Timesheet recalled to draft');
}

// ─── approve ──────────────────────────────────────────────────────────────────

/** POST /timesheets/:id/approve */
export async function approve(req: Request, res: Response): Promise<void> {
  const { id } = req.params as TimesheetParams;
  const timesheet = await service.approveTimesheet(id, req.user!.id, req.user!.role);
  ApiResponse.ok(res, timesheet, 'Timesheet approved');
}

// ─── reject ───────────────────────────────────────────────────────────────────

/** POST /timesheets/:id/reject */
export async function reject(req: Request, res: Response): Promise<void> {
  const { id } = req.params as TimesheetParams;
  const body = req.body as RejectTimesheetBody;
  const timesheet = await service.rejectTimesheet(id, req.user!.role, body);
  ApiResponse.ok(res, timesheet, 'Timesheet rejected');
}

// ─── bulkApprove ──────────────────────────────────────────────────────────────

/** POST /timesheets/bulk-approve */
export async function bulkApprove(req: Request, res: Response): Promise<void> {
  const body = req.body as BulkApproveBody;
  const result = await service.bulkApproveTimesheets(body, req.user!.id, req.user!.role);
  ApiResponse.ok(res, result, `Approved ${result.approved.length} timesheet(s)`);
}
