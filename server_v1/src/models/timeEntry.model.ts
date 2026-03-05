/**
 * @file models/timeEntry.model.ts
 * @description TimeEntry Mongoose schema (individual line items logged by employees).
 *
 * Virtuals:  hoursLabel, billableAmount, statusBadge
 * Indexes:
 *   - userId + date           (compound — employee's daily entries)
 *   - projectId + date        (compound — project burn-down by day)
 *   - userId + projectId + date (compound — uniqueness guard per employee per project per day)
 *   - timesheetId             (backref from timesheet)
 *   - status                  (partial: submitted/approved for approval queue)
 *   - isBillable + projectId  (billing report)
 */

import { Schema, model, type Model, type Types, type HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from './helpers';

// ─── Constants ────────────────────────────────────────────────────────────────

export const ENTRY_STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface ITimeEntry {
  userId:       Types.ObjectId;
  projectId:    Types.ObjectId;
  taskId:       Types.ObjectId;
  timesheetId:  Types.ObjectId | null;
  date:         Date;
  hours:        number;         // e.g. 7.5
  isBillable:   boolean;
  hourlyRate:   number;         // snapshot of user.hourlyRate at entry time
  notes:        string;
  status:       EntryStatus;
  approvedBy:   Types.ObjectId | null;
  approvedAt:   Date | null;
  rejectedBy:   Types.ObjectId | null;
  rejectedAt:   Date | null;
  rejectionNote: string;
}

export interface ITimeEntryVirtuals {
  /** "7h 30m" */
  hoursLabel: string;
  /** hours × hourlyRate rounded to 2 dp */
  billableAmount: number;
  /** Human-readable status e.g. "Pending Approval" */
  statusBadge: string;
}

export type TimeEntryDocument = HydratedDocument<ITimeEntry, Record<string, never>, ITimeEntryVirtuals>;
export type TimeEntryModel    = Model<ITimeEntry, Record<string, never>, Record<string, never>, ITimeEntryVirtuals>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const timeEntrySchema = new Schema<ITimeEntry, TimeEntryModel, Record<string, never>, Record<string, never>, ITimeEntryVirtuals>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User is required'],
    },
    projectId: {
      type:     Schema.Types.ObjectId,
      ref:      'Project',
      required: [true, 'Project is required'],
    },
    taskId: {
      type:     Schema.Types.ObjectId,
      ref:      'Task',
      required: [true, 'Task is required'],
    },
    timesheetId: {
      type:    Schema.Types.ObjectId,
      ref:     'Timesheet',
      default: null,
    },
    date: {
      type:     Date,
      required: [true, 'Date is required'],
      // Store as UTC midnight so date-only comparisons work correctly
      set: (val: Date | string): Date => {
        const d = new Date(val);
        d.setUTCHours(0, 0, 0, 0);
        return d;
      },
    },
    hours: {
      type:     Number,
      required: [true, 'Hours are required'],
      min:      [0.25, 'Minimum entry is 0.25 hours (15 min)'],
      max:      [24,   'Cannot log more than 24 hours in a single entry'],
    },
    isBillable: {
      type:    Boolean,
      default: true,
    },
    hourlyRate: {
      type:    Number,
      min:     [0, 'Hourly rate cannot be negative'],
      default: 0,
    },
    notes: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: [1000, 'Notes must be at most 1000 characters'],
    },
    status: {
      type:    String,
      enum:    { values: ENTRY_STATUSES, message: 'Invalid entry status' },
      default: 'draft',
    },
    approvedBy: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    approvedAt: {
      type:    Date,
      default: null,
    },
    rejectedBy: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    rejectedAt: {
      type:    Date,
      default: null,
    },
    rejectionNote: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: [500, 'Rejection note must be at most 500 characters'],
    },
  },
  baseSchemaOptions(),
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Employee daily view — most common query pattern
timeEntrySchema.index({ userId: 1, date: -1 }, { name: 'idx_entry_user_date' });

// Project burn-down report
timeEntrySchema.index({ projectId: 1, date: -1 }, { name: 'idx_entry_project_date' });

// Uniqueness guard — one entry per user per project per task per day
// (business rule: log additional time by increasing `hours`, not adding duplicate entries)
timeEntrySchema.index(
  { userId: 1, projectId: 1, taskId: 1, date: 1 },
  { unique: true, name: 'idx_entry_user_project_task_date_unique' },
);

// Timesheet back-reference — group entries by timesheet
timeEntrySchema.index({ timesheetId: 1 }, { name: 'idx_entry_timesheet', sparse: true });

// Approval queue — only submitted entries need to appear
timeEntrySchema.index(
  { status: 1, userId: 1 },
  {
    name: 'idx_entry_status_user',
    partialFilterExpression: { status: { $in: ['submitted', 'approved', 'rejected'] } },
  },
);

// Billing report — billable entries by project
timeEntrySchema.index(
  { isBillable: 1, projectId: 1, date: -1 },
  {
    name: 'idx_entry_billable_project',
    partialFilterExpression: { isBillable: true },
  },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

timeEntrySchema.virtual('hoursLabel').get(function (this: TimeEntryDocument): string {
  const h = Math.floor(this.hours);
  const m = Math.round((this.hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
});

timeEntrySchema.virtual('billableAmount').get(function (this: TimeEntryDocument): number {
  if (!this.isBillable) return 0;
  return Math.round(this.hours * this.hourlyRate * 100) / 100;
});

const STATUS_LABELS: Record<EntryStatus, string> = {
  draft:     'Draft',
  submitted: 'Pending Approval',
  approved:  'Approved',
  rejected:  'Rejected',
};

timeEntrySchema.virtual('statusBadge').get(function (this: TimeEntryDocument): string {
  return STATUS_LABELS[this.status] ?? this.status;
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const TimeEntry = model<ITimeEntry, TimeEntryModel>('TimeEntry', timeEntrySchema);
