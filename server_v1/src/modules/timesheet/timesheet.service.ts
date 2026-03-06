/**
 * @file modules/timesheet/timesheet.service.ts
 * @description Business logic for the Timesheet module.
 *
 * Lifecycle transitions:
 *   draft  ──submit──► submitted
 *   submitted ──recall──► draft
 *   submitted ──approve──► approved   (handled by the Approval module)
 *   submitted ──reject──►  rejected   (handled by the Approval module)
 *   rejected  ──edit + resubmit──► submitted
 *
 * Access rules:
 *   - Employees can only read/write their own timesheets.
 *   - Managers and admins can list all timesheets (filter by userId optional).
 *   - Only the owner can submit or recall their own timesheet.
 *   - A timesheet can only be edited when status is draft or rejected.
 *   - A timesheet can only be recalled when status is submitted.
 *   - A draft timesheet can be deleted (hard delete).
 */

import { ApiError } from "@utils/ApiError";
import { buildSort } from "@utils/pagination";
import type { PaginationMeta } from "@utils/ApiResponse";
import type { ITimesheet } from "@models/index";
import type { Types } from "mongoose";
import * as repo from "./timesheet.repository";
import type {
  CreateTimesheetBody,
  UpdateTimesheetBody,
  ListTimesheetsQuery,
  RejectTimesheetBody,
  BulkApproveBody,
} from "./timesheet.validator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimesheetDoc = ITimesheet & { _id: Types.ObjectId };

export interface ListTimesheetsResult {
  timesheets: TimesheetDoc[];
  meta: PaginationMeta;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sums hours from embedded entry summaries. */
function sumHours(entries: ITimesheet["entries"]): number {
  return entries.reduce((acc, e) => acc + e.hours, 0);
}

// ─── createTimesheet ──────────────────────────────────────────────────────────

/**
 * Creates a new draft timesheet for the authenticated user.
 *
 * @throws 409 if a timesheet already exists for the same user + period start.
 */
export async function createTimesheet(
  userId: string,
  body: CreateTimesheetBody,
): Promise<TimesheetDoc> {
  const periodStart = new Date(body.periodStart);
  periodStart.setUTCHours(0, 0, 0, 0);

  const existing = await repo.findByUserAndPeriod(userId, periodStart);
  if (existing) {
    throw ApiError.conflict(
      "A timesheet for this period already exists. Use PATCH to update it.",
    );
  }

  return repo.createTimesheet(userId, body);
}

// ─── listTimesheets ───────────────────────────────────────────────────────────

/**
 * Returns a paginated list of timesheets.
 *
 * - Employees always see only their own timesheets.
 * - Managers/admins can optionally filter by userId; omitting it returns all.
 */
export async function listTimesheets(
  requesterId: string,
  requesterRole: string,
  query: ListTimesheetsQuery,
): Promise<ListTimesheetsResult> {
  const isPrivileged = requesterRole === "manager" || requesterRole === "admin";

  const filter: repo.ListTimesheetsFilter = {
    // Employees always scoped to themselves; managers/admins can filter
    userId: isPrivileged ? query.userId : requesterId,
    status: query.status,
  };

  const sort = buildSort(query.sortBy, query.order);
  const { timesheets, total } = await repo.listTimesheets(query, filter, sort);

  const totalPages = Math.ceil(total / query.limit);

  return {
    timesheets,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    },
  };
}

// ─── getTimesheetById ─────────────────────────────────────────────────────────

/**
 * Returns a single timesheet by ID.
 *
 * @throws 404 if not found.
 * @throws 403 if the requester is not the owner and not manager/admin.
 */
export async function getTimesheetById(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<TimesheetDoc> {
  const ts = await repo.findById(id);
  if (!ts) throw ApiError.notFound("Timesheet");

  const isOwner = String(ts.userId) === requesterId;
  const isPrivileged = requesterRole === "manager" || requesterRole === "admin";

  if (!isOwner && !isPrivileged) {
    throw ApiError.forbidden("You can only view your own timesheets");
  }

  return ts;
}

// ─── updateTimesheet ──────────────────────────────────────────────────────────

/**
 * Partially updates a timesheet's notes and/or entries.
 *
 * Business rules:
 *   - Only the owner can update.
 *   - Only editable when status is draft or rejected.
 *   - totalHours is recalculated from the new entries list.
 *
 * @throws 404 if not found.
 * @throws 403 if not the owner.
 * @throws 422 if the timesheet is not editable.
 */
export async function updateTimesheet(
  id: string,
  requesterId: string,
  body: UpdateTimesheetBody,
): Promise<TimesheetDoc> {
  const ts = await repo.findById(id);
  if (!ts) throw ApiError.notFound("Timesheet");
  if (String(ts.userId) !== requesterId) {
    throw ApiError.forbidden("You can only edit your own timesheets");
  }
  if (ts.status !== "draft" && ts.status !== "rejected") {
    throw ApiError.badRequest(
      `Timesheet cannot be edited in '${ts.status}' status. Only draft or rejected timesheets are editable.`,
    );
  }

  const patch: Parameters<typeof repo.updateTimesheet>[1] = {};
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.entries !== undefined) {
    // Cast: validator ensures shape matches ITimesheetEntry
    patch.entries = body.entries as ITimesheet["entries"];
    patch.totalHours = sumHours(patch.entries);
  }

  const updated = await repo.updateTimesheet(id, patch);
  if (!updated) throw ApiError.notFound("Timesheet");

  return updated;
}

// ─── deleteTimesheet ──────────────────────────────────────────────────────────

/**
 * Hard-deletes a draft timesheet.
 *
 * @throws 404 if not found.
 * @throws 403 if not the owner.
 * @throws 422 if not in draft status.
 */
export async function deleteTimesheet(
  id: string,
  requesterId: string,
): Promise<void> {
  const ts = await repo.findById(id);
  if (!ts) throw ApiError.notFound("Timesheet");
  if (String(ts.userId) !== requesterId) {
    throw ApiError.forbidden("You can only delete your own timesheets");
  }
  if (ts.status !== "draft") {
    throw ApiError.badRequest(
      `Only draft timesheets can be deleted. Current status: '${ts.status}'.`,
    );
  }

  await repo.removeTimesheet(id);
}

// ─── submitTimesheet ──────────────────────────────────────────────────────────

/**
 * Transitions a timesheet from draft → submitted.
 *
 * Business rules:
 *   - Only the owner can submit.
 *   - Only draft (or rejected) timesheets can be submitted.
 *   - Must have at least one entry.
 *
 * @throws 404 if not found.
 * @throws 403 if not the owner.
 * @throws 422 if not in a submittable state.
 */
export async function submitTimesheet(
  id: string,
  requesterId: string,
): Promise<TimesheetDoc> {
  const ts = await repo.findById(id);
  if (!ts) throw ApiError.notFound("Timesheet");
  if (String(ts.userId) !== requesterId) {
    throw ApiError.forbidden("You can only submit your own timesheets");
  }
  if (ts.status !== "draft" && ts.status !== "rejected") {
    throw ApiError.badRequest(
      `Timesheet cannot be submitted from '${ts.status}' status.`,
    );
  }
  if (ts.entries.length === 0) {
    throw ApiError.badRequest(
      "Cannot submit an empty timesheet. Add at least one entry first.",
    );
  }

  const updated = await repo.updateTimesheet(id, {
    status: "submitted",
    submittedAt: new Date(),
  });
  if (!updated) throw ApiError.notFound("Timesheet");

  return updated;
}

// ─── recallTimesheet ──────────────────────────────────────────────────────────

/**
 * Transitions a timesheet from submitted → draft (recall before approval).
 *
 * Business rules:
 *   - Only the owner can recall.
 *   - Only submitted timesheets can be recalled (not approved/rejected).
 *
 * @throws 404 if not found.
 * @throws 403 if not the owner.
 * @throws 422 if not in submitted status.
 */
export async function recallTimesheet(
  id: string,
  requesterId: string,
): Promise<TimesheetDoc> {
  const ts = await repo.findById(id);
  if (!ts) throw ApiError.notFound("Timesheet");
  if (String(ts.userId) !== requesterId) {
    throw ApiError.forbidden("You can only recall your own timesheets");
  }
  if (ts.status !== "submitted") {
    throw ApiError.badRequest(
      `Only submitted timesheets can be recalled. Current status: '${ts.status}'.`,
    );
  }

  const updated = await repo.updateTimesheet(id, {
    status: "draft",
    recalledAt: new Date(),
  });
  if (!updated) throw ApiError.notFound("Timesheet");

  return updated;
}

// ─── approveTimesheet ─────────────────────────────────────────────────────────

/**
 * Transitions a timesheet from submitted → approved.
 *
 * Business rules:
 *   - Only managers/admins can approve.
 *   - Only submitted timesheets can be approved.
 *
 * @throws 404 if not found.
 * @throws 403 if requester is not privileged.
 * @throws 422 if not in submitted status.
 */
export async function approveTimesheet(
  id: string,
  approverId: string,
  approverRole: string,
): Promise<TimesheetDoc> {
  if (approverRole !== "manager" && approverRole !== "admin") {
    throw ApiError.forbidden("Only managers or admins can approve timesheets");
  }

  const ts = await repo.findById(id);
  if (!ts) throw ApiError.notFound("Timesheet");

  if (ts.status !== "submitted") {
    throw ApiError.badRequest(
      `Only submitted timesheets can be approved. Current status: '${ts.status}'.`,
    );
  }

  const updated = await repo.updateTimesheet(id, {
    status: "approved",
    managerId: approverId,
    approvedAt: new Date(),
  });
  if (!updated) throw ApiError.notFound("Timesheet");

  return updated;
}

// ─── rejectTimesheet ──────────────────────────────────────────────────────────

/**
 * Transitions a timesheet from submitted → rejected.
 *
 * Business rules:
 *   - Only managers/admins can reject.
 *   - Only submitted timesheets can be rejected.
 *
 * @throws 404 if not found.
 * @throws 403 if requester is not privileged.
 * @throws 422 if not in submitted status.
 */
export async function rejectTimesheet(
  id: string,
  rejectorRole: string,
  body: RejectTimesheetBody,
): Promise<TimesheetDoc> {
  if (rejectorRole !== "manager" && rejectorRole !== "admin") {
    throw ApiError.forbidden("Only managers or admins can reject timesheets");
  }

  const ts = await repo.findById(id);
  if (!ts) throw ApiError.notFound("Timesheet");

  if (ts.status !== "submitted") {
    throw ApiError.badRequest(
      `Only submitted timesheets can be rejected. Current status: '${ts.status}'.`,
    );
  }

  const updated = await repo.updateTimesheet(id, {
    status: "rejected",
    notes: body.reason,
    rejectedAt: new Date(),
  });
  if (!updated) throw ApiError.notFound("Timesheet");

  return updated;
}

// ─── bulkApproveTimesheets ────────────────────────────────────────────────────

/**
 * Approves multiple submitted timesheets in one operation.
 *
 * Skips any IDs that are not found or are not in submitted status — they are
 * collected and returned as `skipped` so the caller can surface feedback.
 *
 * @throws 403 if requester is not privileged.
 */
export async function bulkApproveTimesheets(
  body: BulkApproveBody,
  approverId: string,
  approverRole: string,
): Promise<{ approved: string[]; skipped: string[] }> {
  if (approverRole !== "manager" && approverRole !== "admin") {
    throw ApiError.forbidden("Only managers or admins can approve timesheets");
  }

  const approved: string[] = [];
  const skipped: string[] = [];

  await Promise.all(
    body.ids.map(async (id) => {
      const ts = await repo.findById(id);
      if (!ts || ts.status !== "submitted") {
        skipped.push(id);
        return;
      }
      await repo.updateTimesheet(id, {
        status: "approved",
        managerId: approverId,
        approvedAt: new Date(),
      });
      approved.push(id);
    }),
  );

  return { approved, skipped };
}
