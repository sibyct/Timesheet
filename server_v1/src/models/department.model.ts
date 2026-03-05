/**
 * @file models/department.model.ts
 * @description Department Mongoose schema.
 *
 * Virtuals:  memberCount (populated), displayLabel
 * Indexes:
 *   - name       (unique, case-insensitive collation)
 *   - managerId  (manager lookups)
 *   - costCenter (finance reporting)
 */

import { Schema, model, type Model, type Types, type HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from './helpers';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface IDepartment {
  name:        string;
  description: string;
  managerId:   Types.ObjectId | null;
  costCenter:  string;
  isActive:    boolean;
}

export interface IDepartmentVirtuals {
  /** "Engineering (CC-1001)" */
  displayLabel: string;
}

export type DepartmentDocument = HydratedDocument<IDepartment, Record<string, never>, IDepartmentVirtuals>;
export type DepartmentModel   = Model<IDepartment, Record<string, never>, Record<string, never>, IDepartmentVirtuals>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const departmentSchema = new Schema<IDepartment, DepartmentModel, Record<string, never>, Record<string, never>, IDepartmentVirtuals>(
  {
    name: {
      type:      String,
      required:  [true, 'Department name is required'],
      trim:      true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    managerId: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    costCenter: {
      type:    String,
      trim:    true,
      default: '',
      match:   [/^[A-Z0-9\-]*$/, 'Cost centre must be alphanumeric with dashes (e.g. CC-1001)'],
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  baseSchemaOptions(),
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Case-insensitive unique name — prevents "Engineering" vs "engineering" duplicates
departmentSchema.index(
  { name: 1 },
  {
    unique:    true,
    name:      'idx_dept_name_unique',
    collation: { locale: 'en', strength: 2 },
  },
);

// Manager lookup (find all departments a user manages)
departmentSchema.index({ managerId: 1 }, { name: 'idx_dept_manager' });

// Finance cost-centre queries
departmentSchema.index(
  { costCenter: 1 },
  {
    name:   'idx_dept_cost_center',
    sparse: true, // only index non-empty cost centres
  },
);

// Partial index for active-only queries (most screens filter by isActive)
departmentSchema.index(
  { isActive: 1 },
  { name: 'idx_dept_active', partialFilterExpression: { isActive: true } },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

departmentSchema.virtual('displayLabel').get(function (this: DepartmentDocument): string {
  return this.costCenter ? `${this.name} (${this.costCenter})` : this.name;
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const Department = model<IDepartment, DepartmentModel>('Department', departmentSchema);
