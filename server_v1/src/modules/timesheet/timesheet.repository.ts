/**
 * @file modules/timesheet/timesheet.repository.ts
 * @description Data-access layer for the Timesheet collection.
 *
 * All Mongoose queries are isolated here.
 * Services call repository methods — never Mongoose directly.
 *
 * Naming conventions:
 *   find*  — returns null if not found (service decides whether to throw)
 *   list*  — returns { timesheets, total } for paginated results
 *   create / update / remove — write operations
 */

import { Types } from "mongoose";
import { Timesheet } from "@models/index";
import type { ITimesheet, TimesheetDocument } from "@models/index";
import type { SortObject } from "@utils/pagination";
import type {
  CreateTimesheetBody,
  ListTimesheetsQuery,
} from "./timesheet.validator";

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * Finds a timesheet by MongoDB _id.
 * Returns a lean plain object (no Mongoose overhead for reads).
 */
export async function findById(
  id: string,
): Promise<(ITimesheet & { _id: Types.ObjectId }) | null> {
  return Timesheet.findById(id).lean();
}

/**
 * Returns the hydrated Mongoose document for operations that need instance
 * methods or virtuals.
 */
export async function findDocumentById(
  id: string,
): Promise<TimesheetDocument | null> {
  return Timesheet.findById(id) as Promise<TimesheetDocument | null>;
}

/**
 * Checks whether a timesheet already exists for a given user + period.
 * Used to enforce the one-sheet-per-period-per-user business rule.
 */
export async function findByUserAndPeriod(
  userId: string,
  periodStart: Date,
): Promise<(ITimesheet & { _id: Types.ObjectId }) | null> {
  return Timesheet.findOne({
    userId: new Types.ObjectId(userId),
    periodStart,
  }).lean();
}

// ─── List ──────────────────────────────────────────────────────────────────────

export interface ListTimesheetsFilter {
  userId?: string; // if omitted + admin → all users
  status?: ITimesheet["status"];
}

export interface ListTimesheetsResult {
  timesheets: (ITimesheet & { _id: Types.ObjectId })[];
  total: number;
}

/**
 * Returns a paginated, filtered list of timesheets.
 * Uses lean() for performance — read-only list results.
 */
export async function listTimesheets(
  query: ListTimesheetsQuery,
  filter: ListTimesheetsFilter,
  sort: SortObject,
): Promise<ListTimesheetsResult> {
  const mongoFilter: Record<string, unknown> = {};

  if (filter.userId) mongoFilter["userId"] = new Types.ObjectId(filter.userId);
  if (filter.status) mongoFilter["status"] = filter.status;

  const skip = (query.page - 1) * query.limit;

  const [timesheets, total] = await Promise.all([
    Timesheet.find(mongoFilter).sort(sort).skip(skip).limit(query.limit).lean(),
    Timesheet.countDocuments(mongoFilter),
  ]);

  return { timesheets, total };
}

// ─── Write ─────────────────────────────────────────────────────────────────────

/**
 * Creates a new draft timesheet document.
 * Returns the lean saved document.
 */
export async function createTimesheet(
  userId: string,
  data: CreateTimesheetBody,
): Promise<ITimesheet & { _id: Types.ObjectId }> {
  const doc = await Timesheet.create({
    userId: new Types.ObjectId(userId),
    periodStart: new Date(data.periodStart),
    periodEnd: new Date(data.periodEnd),
    notes: data.notes ?? "",
    status: "draft",
  });
  return doc.toObject();
}

/**
 * Applies a partial update to a timesheet document.
 * Returns the updated lean document, or null if not found.
 */
export async function updateTimesheet(
  id: string,
  patch: Partial<
    Pick<
      ITimesheet,
      | "notes"
      | "entries"
      | "totalHours"
      | "status"
      | "submittedAt"
      | "recalledAt"
    >
  >,
): Promise<(ITimesheet & { _id: Types.ObjectId }) | null> {
  return Timesheet.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, runValidators: true },
  ).lean();
}

/**
 * Hard-deletes a timesheet by id.
 * The service layer ensures only draft timesheets can be deleted.
 */
export async function removeTimesheet(id: string): Promise<boolean> {
  const result = await Timesheet.findByIdAndDelete(id);
  return result !== null;
}
