/**
 * @file models/task.model.ts
 * @description Task Mongoose schema (work items within a project).
 *
 * Virtuals:  displayLabel, billableLabel
 * Indexes:
 *   - projectId + name  (compound unique — no duplicate task names per project)
 *   - projectId + isActive (partial — active task list per project)
 *   - isBillable        (filter billable tasks for billing reports)
 */

import {
  Schema,
  model,
  type Model,
  type Types,
  type HydratedDocument,
} from "mongoose";
import { baseSchemaOptions } from "./helpers";

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface ITask {
  projectId: Types.ObjectId;
  name: string;
  description: string;
  isBillable: boolean;
  isActive: boolean;
  sortOrder: number; // controls display order within a project
}

export interface ITaskVirtuals {
  /** "API Development [Billable]" */
  displayLabel: string;
  /** "Billable" | "Non-billable" */
  billableLabel: string;
}

export type TaskDocument = HydratedDocument<
  ITask,
  Record<string, never>,
  ITaskVirtuals
>;
export type TaskModel = Model<
  ITask,
  Record<string, never>,
  Record<string, never>,
  ITaskVirtuals
>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const taskSchema = new Schema<
  ITask,
  TaskModel,
  Record<string, never>,
  Record<string, never>,
  ITaskVirtuals
>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    name: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [150, "Name must be at most 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description must be at most 1000 characters"],
    },
    isBillable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, "Sort order cannot be negative"],
    },
  },
  baseSchemaOptions(),
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// No two tasks with the same name may exist within a single project
taskSchema.index(
  { projectId: 1, name: 1 },
  {
    unique: true,
    name: "idx_task_project_name_unique",
    collation: { locale: "en", strength: 2 }, // case-insensitive uniqueness
  },
);

// Active task list for a project (time entry dropdowns)
taskSchema.index(
  { projectId: 1, isActive: 1, sortOrder: 1 },
  {
    name: "idx_task_project_active_sort",
    partialFilterExpression: { isActive: true },
  },
);

// Billing report: filter only billable tasks across all projects
taskSchema.index(
  { isBillable: 1 },
  {
    name: "idx_task_billable",
    sparse: false,
  },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

taskSchema.virtual("displayLabel").get(function (this: TaskDocument): string {
  return this.isBillable ? `${this.name} [Billable]` : this.name;
});

taskSchema.virtual("billableLabel").get(function (this: TaskDocument): string {
  return this.isBillable ? "Billable" : "Non-billable";
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const Task = model<ITask, TaskModel>("Task", taskSchema);
