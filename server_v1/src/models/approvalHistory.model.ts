/**
 * @file models/approvalHistory.model.ts
 * @description ApprovalHistory Mongoose schema.
 *
 * Immutable audit trail — one document per action taken on a timesheet.
 * Documents are NEVER updated; only inserted via repository.create().
 *
 * Virtuals:  actionLabel, summaryLine
 * Indexes:
 *   - timesheetId + timestamp  (timeline view for a single timesheet)
 *   - actorId + timestamp      (auditor view: what did this manager do?)
 *   - action + timestamp       (admin dashboard: recent approvals/rejections)
 *   - timestamp TTL            (auto-purge audit records older than 2 years)
 */

import {
  Schema,
  model,
  type Model,
  type Types,
  type HydratedDocument,
} from "mongoose";
import { baseSchemaOptions } from "./helpers";

// ─── Constants ────────────────────────────────────────────────────────────────

export const APPROVAL_ACTIONS = [
  "submitted", // employee submitted the timesheet
  "recalled", // employee recalled before manager acted
  "approved", // manager approved
  "rejected", // manager rejected
  "auto_approved", // system auto-approved after SLA window
] as const;

export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number];

/** TTL: 2 years in seconds */
const TWO_YEARS_SECONDS = 2 * 365 * 24 * 60 * 60;

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface IApprovalHistory {
  timesheetId: Types.ObjectId;
  actorId: Types.ObjectId; // user who performed the action
  action: ApprovalAction;
  comment: string; // manager rejection note or approval message
  timestamp: Date; // explicit (not relying on createdAt) for TTL index
  /** IP address for security audit (optional) */
  ipAddress: string;
  /** User-agent for security audit (optional) */
  userAgent: string;
}

export interface IApprovalHistoryVirtuals {
  /** "Approved" | "Rejected" | "Submitted" … */
  actionLabel: string;
  /** "Manager (Jane Doe) approved this timesheet on Apr 5, 2024" — populated after .populate('actorId') */
  summaryLine: string;
}

export type ApprovalHistoryDocument = HydratedDocument<
  IApprovalHistory,
  Record<string, never>,
  IApprovalHistoryVirtuals
>;
export type ApprovalHistoryModel = Model<
  IApprovalHistory,
  Record<string, never>,
  Record<string, never>,
  IApprovalHistoryVirtuals
>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const approvalHistorySchema = new Schema<IApprovalHistory>(
  {
    timesheetId: {
      type: Schema.Types.ObjectId,
      ref: "Timesheet",
      required: [true, "Timesheet reference is required"],
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor (user) reference is required"],
    },
    action: {
      type: String,
      enum: { values: APPROVAL_ACTIONS, message: "Invalid approval action" },
      required: [true, "Action is required"],
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Comment must be at most 2000 characters"],
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
      // Index with TTL below — field is explicit so TTL fires correctly
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "User-agent must be at most 500 characters"],
    },
  },
  {
    ...baseSchemaOptions(),
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Timeline for a single timesheet (status history panel)
approvalHistorySchema.index(
  { timesheetId: 1, timestamp: 1 },
  { name: "idx_ah_timesheet_timeline" },
);

// Manager audit trail — what actions did this actor perform?
approvalHistorySchema.index(
  { actorId: 1, timestamp: -1 },
  { name: "idx_ah_actor_time" },
);

// Admin dashboard — recent approvals/rejections across all timesheets
approvalHistorySchema.index(
  { action: 1, timestamp: -1 },
  { name: "idx_ah_action_time" },
);

// TTL index — MongoDB automatically deletes audit records after 2 years.
// IMPORTANT: This uses the explicit `timestamp` field, NOT `createdAt`,
// because `createdAt` may not be set on older documents after migrations.
approvalHistorySchema.index(
  { timestamp: 1 },
  {
    name: "idx_ah_ttl",
    expireAfterSeconds: TWO_YEARS_SECONDS,
  },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<ApprovalAction, string> = {
  submitted: "Submitted",
  recalled: "Recalled",
  approved: "Approved",
  rejected: "Rejected",
  auto_approved: "Auto-approved",
};

approvalHistorySchema.virtual("actionLabel").get(function (
  this: ApprovalHistoryDocument,
): string {
  return ACTION_LABELS[this.action] ?? this.action;
});

approvalHistorySchema.virtual("summaryLine").get(function (
  this: ApprovalHistoryDocument,
): string {
  const dateStr = this.timestamp.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const label = ACTION_LABELS[this.action] ?? this.action;
  const comment = this.comment ? ` — "${this.comment}"` : "";
  return `${label} on ${dateStr}${comment}`;
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const ApprovalHistory = model<IApprovalHistory, ApprovalHistoryModel>(
  "ApprovalHistory",
  approvalHistorySchema,
);
