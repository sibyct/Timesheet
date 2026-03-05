/**
 * @file models/helpers.ts
 * @description Shared Mongoose schema utilities.
 *
 * - `baseSchemaOptions`   — timestamps, versionKey, toJSON applied to every schema
 * - `buildToJSON`         — strips sensitive fields + renames `_id` → `id`
 * - `SENSITIVE_FIELDS`    — master list of fields stripped from JSON output
 */

import type { ToObjectOptions, Types } from "mongoose";

// ─── Sensitive Fields ─────────────────────────────────────────────────────────

/**
 * Fields that must NEVER appear in any serialised response.
 * Add to this list whenever a new secret field is introduced.
 */
export const SENSITIVE_FIELDS = ["password", "refreshToken", "__v"] as const;

// ─── toJSON Transform ─────────────────────────────────────────────────────────

/**
 * Standard toJSON transform applied to every schema.
 *
 * - Renames `_id` → `id` (string)
 * - Deletes `_id`, `__v`, and all sensitive fields
 * - Preserves all virtuals
 *
 * @param extraStrip - Additional field names to strip beyond SENSITIVE_FIELDS
 */
export function buildToJSON(extraStrip: string[] = []): ToObjectOptions {
  return {
    virtuals: true,
    versionKey: false,
    transform(_doc: any, ret: Record<string, any>): void {
      ret["id"] = String(ret["_id"] as Types.ObjectId);
      delete ret["_id"];

      const toRemove = [...SENSITIVE_FIELDS, ...extraStrip];
      for (const field of toRemove) {
        delete ret[field];
      }
    },
  };
}

// ─── Base Schema Options ──────────────────────────────────────────────────────

/**
 * Default options shared by every Mongoose schema in this project.
 *
 * @param extraStrip - Additional field names to strip in toJSON
 */
export function baseSchemaOptions(extraStrip: string[] = []) {
  return {
    timestamps: true as const,
    versionKey: false as const,
    toJSON: buildToJSON(extraStrip),
    toObject: buildToJSON(extraStrip),
  };
}
