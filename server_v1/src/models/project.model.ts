/**
 * @file models/project.model.ts
 * @description Project Mongoose schema.
 *
 * Virtuals:  budgetLabel, memberCount, isOverBudget, durationDays
 * Indexes:
 *   - code            (unique)
 *   - clientId + status (compound — client billing view)
 *   - members         (multikey — find all projects a user is on)
 *   - status          (partial: active/on_hold only)
 *   - startDate + endDate (date-range queries)
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

export const PROJECT_STATUSES = [
  "active",
  "on_hold",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface IProject {
  name: string;
  code: string; // Short unique code e.g. "PRJ-001"
  description: string;
  clientId: Types.ObjectId;
  budget: number; // budget in client's currency
  spentBudget: number; // denormalised; updated by billing aggregation
  members: Types.ObjectId[];
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
}

export interface IProjectVirtuals {
  /** "$12,500.00 / $20,000.00" */
  budgetLabel: string;
  /** true when spentBudget > budget */
  isOverBudget: boolean;
  memberCount: number;
  /** Calendar days from startDate to endDate (null when dates not set) */
  durationDays: number | null;
}

export type ProjectDocument = HydratedDocument<
  IProject,
  Record<string, never>,
  IProjectVirtuals
>;
export type ProjectModel = Model<
  IProject,
  Record<string, never>,
  Record<string, never>,
  IProjectVirtuals
>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const projectSchema = new Schema<
  IProject,
  ProjectModel,
  Record<string, never>,
  Record<string, never>,
  IProjectVirtuals
>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [150, "Name must be at most 150 characters"],
    },
    code: {
      type: String,
      required: [true, "Project code is required"],
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z0-9\-]{2,20}$/,
        "Code must be 2-20 uppercase alphanumeric characters or dashes",
      ],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description must be at most 2000 characters"],
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
      default: 0,
    },
    spentBudget: {
      type: Number,
      min: [0, "Spent budget cannot be negative"],
      default: 0,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: { values: PROJECT_STATUSES, message: "Invalid project status" },
      default: "active",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator(value: Date | null): boolean {
          if (!value || !this.startDate) return true;
          return value >= this.startDate;
        },
        message: "End date must be on or after start date",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  baseSchemaOptions(),
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Project code is a human-readable unique identifier
projectSchema.index(
  { code: 1 },
  { unique: true, name: "idx_project_code_unique" },
);

// Billing screen: all projects for a client filtered by status
projectSchema.index(
  { clientId: 1, status: 1 },
  { name: "idx_project_client_status" },
);

// Multikey index — efficiently find all projects a user is assigned to
projectSchema.index({ members: 1 }, { name: "idx_project_members" });

// Partial index for open projects only (active + on_hold)
projectSchema.index(
  { status: 1, isActive: 1 },
  {
    name: "idx_project_open",
    partialFilterExpression: {
      status: { $in: ["active", "on_hold"] },
      isActive: true,
    },
  },
);

// Date-range queries for scheduling / Gantt views
projectSchema.index(
  { startDate: 1, endDate: 1 },
  { name: "idx_project_dates" },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

projectSchema.virtual("budgetLabel").get(function (
  this: ProjectDocument,
): string {
  const fmt = (n: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  return `${fmt(this.spentBudget)} / ${fmt(this.budget)}`;
});

projectSchema.virtual("isOverBudget").get(function (
  this: ProjectDocument,
): boolean {
  return this.budget > 0 && this.spentBudget > this.budget;
});

projectSchema.virtual("memberCount").get(function (
  this: ProjectDocument,
): number {
  return this.members.length;
});

projectSchema.virtual("durationDays").get(function (
  this: ProjectDocument,
): number | null {
  if (!this.startDate || !this.endDate) return null;
  const ms = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(ms / 86_400_000);
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const Project = model<IProject, ProjectModel>("Project", projectSchema);
