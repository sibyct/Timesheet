/**
 * @file models/timesheet.model.ts
 * @description Timesheet Mongoose schema (weekly/period wrapper around TimeEntry[]).
 *
 * A Timesheet groups a user's time entries for a payroll period and moves
 * through the lifecycle:  draft → submitted → approved | rejected → (recalled → draft)
 *
 * Virtuals:  periodLabel, totalBillableHours, totalNonBillableHours,
 *            hoursLabel, isEditable, isLate
 * Indexes:
 *   - userId + periodStart    (compound unique — one sheet per period per user)
 *   - userId + status         (employee's sheets by status)
 *   - managerId + status      (manager approval queue)
 *   - status                  (partial: submitted — global queue)
 *   - periodStart + periodEnd (date-range report)
 */

import {
  Schema,
  model,
  type Model,
  type Types,
  type HydratedDocument,
} from "mongoose";
import { baseSchemaOptions } from "./helpers";
import type { EntryStatus } from "./timeEntry.model";

// ─── Constants ────────────────────────────────────────────────────────────────

export const TIMESHEET_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

/** Embedded summary of a TimeEntry inside the Timesheet.entries array */
export interface ITimesheetEntry {
  entryId: Types.ObjectId; // ref → TimeEntry
  projectId: Types.ObjectId; // denormalised for fast display
  taskId: Types.ObjectId; // denormalised for fast display
  date: Date;
  hours: number;
  isBillable: boolean;
  status: EntryStatus;
}

export interface ITimesheet {
  userId: Types.ObjectId;
  managerId: Types.ObjectId | null; // manager at time of submission
  periodStart: Date;
  periodEnd: Date;
  totalHours: number;
  status: TimesheetStatus;
  entries: ITimesheetEntry[]; // embedded summaries (full data in TimeEntry)
  notes: string;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  recalledAt: Date | null;
}

export interface ITimesheetVirtuals {
  /** "2024-W14  (Apr 1 – Apr 7, 2024)" */
  periodLabel: string;
  totalBillableHours: number;
  totalNonBillableHours: number;
  /** "40h 00m" */
  hoursLabel: string;
  /** true when status is draft or rejected (can still be edited) */
  isEditable: boolean;
  /** true when submitted after periodEnd + 2 business days */
  isLate: boolean;
}

export type TimesheetDocument = HydratedDocument<
  ITimesheet,
  Record<string, never>,
  ITimesheetVirtuals
>;
export type TimesheetModel = Model<
  ITimesheet,
  Record<string, never>,
  Record<string, never>,
  ITimesheetVirtuals
>;

// ─── Sub-schema ───────────────────────────────────────────────────────────────

const timesheetEntrySchema = new Schema<ITimesheetEntry>(
  {
    entryId: { type: Schema.Types.ObjectId, ref: "TimeEntry", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0.25 },
    isBillable: { type: Boolean, required: true },
    status: { type: String, required: true },
  },
  { _id: false, versionKey: false }, // no sub-document _id or __v needed
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const timesheetSchema = new Schema<
  ITimesheet,
  TimesheetModel,
  Record<string, never>,
  Record<string, never>,
  ITimesheetVirtuals
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    periodStart: {
      type: Date,
      required: [true, "Period start date is required"],
      set: (val: Date | string): Date => {
        const d = new Date(val);
        d.setUTCHours(0, 0, 0, 0);
        return d;
      },
    },
    periodEnd: {
      type: Date,
      required: [true, "Period end date is required"],
      set: (val: Date | string): Date => {
        const d = new Date(val);
        d.setUTCHours(23, 59, 59, 999);
        return d;
      },
      validate: {
        validator(this: any, val: Date): boolean {
          return val > this.periodStart;
        },
        message: "Period end must be after period start",
      },
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, "Total hours cannot be negative"],
    },
    status: {
      type: String,
      enum: { values: TIMESHEET_STATUSES, message: "Invalid timesheet status" },
      default: "draft",
    },
    entries: {
      type: [timesheetEntrySchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Notes must be at most 2000 characters"],
    },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    recalledAt: { type: Date, default: null },
  },
  baseSchemaOptions(),
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// One timesheet per user per period (prevents double-submission)
timesheetSchema.index(
  { userId: 1, periodStart: 1 },
  { unique: true, name: "idx_ts_user_period_unique" },
);

// Employee view: "my timesheets" filtered by status
timesheetSchema.index(
  { userId: 1, status: 1, periodStart: -1 },
  { name: "idx_ts_user_status_date" },
);

// Manager approval queue — only submitted sheets
timesheetSchema.index(
  { managerId: 1, status: 1 },
  {
    name: "idx_ts_manager_status",
    partialFilterExpression: { status: "submitted" },
  },
);

// Global admin queue — all submitted sheets sorted newest first
timesheetSchema.index(
  { status: 1, submittedAt: -1 },
  {
    name: "idx_ts_status_submitted",
    partialFilterExpression: { status: "submitted" },
  },
);

// Date-range reports (utilization, billing)
timesheetSchema.index(
  { periodStart: 1, periodEnd: 1 },
  { name: "idx_ts_period_range" },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/** ISO week number helper (ISO 8601) */
function isoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

timesheetSchema.virtual("periodLabel").get(function (
  this: TimesheetDocument,
): string {
  const week = isoWeek(this.periodStart);
  const year = this.periodStart.getUTCFullYear();
  return `${year}-W${String(week).padStart(2, "0")}  (${fmtDate(this.periodStart)} – ${fmtDate(this.periodEnd)})`;
});

timesheetSchema.virtual("totalBillableHours").get(function (
  this: TimesheetDocument,
): number {
  return this.entries
    .filter((e) => e.isBillable)
    .reduce((sum, e) => sum + e.hours, 0);
});

timesheetSchema.virtual("totalNonBillableHours").get(function (
  this: TimesheetDocument,
): number {
  return this.entries
    .filter((e) => !e.isBillable)
    .reduce((sum, e) => sum + e.hours, 0);
});

timesheetSchema.virtual("hoursLabel").get(function (
  this: TimesheetDocument,
): string {
  const h = Math.floor(this.totalHours);
  const m = Math.round((this.totalHours - h) * 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
});

timesheetSchema.virtual("isEditable").get(function (
  this: TimesheetDocument,
): boolean {
  return this.status === "draft" || this.status === "rejected";
});

timesheetSchema.virtual("isLate").get(function (
  this: TimesheetDocument,
): boolean {
  if (!this.submittedAt) return false;
  // Allow 2 days grace after period end
  const grace = new Date(this.periodEnd);
  grace.setUTCDate(grace.getUTCDate() + 2);
  return this.submittedAt > grace;
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const Timesheet = model<ITimesheet, TimesheetModel>(
  "Timesheet",
  timesheetSchema,
);
