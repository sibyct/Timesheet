/**
 * @file models/user.model.ts
 * @description User Mongoose schema.
 *
 * Virtuals:  fullName, maskedEmail, isAdmin, isManager
 * Methods:   comparePassword
 * Indexes:
 *   - email          (unique)
 *   - role + isActive (partial: isActive = true)
 *   - managerId      (for team lookups)
 *   - department     (for department filtering)
 *   - refreshToken   (TTL-adjacent: queried on token rotation)
 * toJSON:    strips password, refreshToken
 */

import {
  Schema,
  model,
  type Model,
  type Types,
  type HydratedDocument,
} from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "@config/env";
import { baseSchemaOptions } from "./helpers";

// ─── Constants ────────────────────────────────────────────────────────────────

export const USER_ROLES = ["employee", "manager", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

/** Persisted fields (raw document shape) */
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  department: Types.ObjectId;
  managerId: Types.ObjectId | null;
  hourlyRate: number;
  isActive: boolean;
  refreshToken: string | null;
  lastLoginAt: Date | null;
}

/** Instance methods */
export interface IUserMethods {
  /**
   * Compares a plain-text candidate password against the stored bcrypt hash.
   * @param candidate - Plain-text password from the login request
   */
  comparePassword(candidate: string): Promise<boolean>;
}

/** Virtual properties */
export interface IUserVirtuals {
  /** "Jane Doe" */
  fullName: string;
  /** "j***e@company.com" */
  maskedEmail: string;
  isAdmin: boolean;
  isManager: boolean;
}

/** Full hydrated document type */
export type UserDocument = HydratedDocument<
  IUser,
  IUserMethods & IUserVirtuals
>;

/** Mongoose model type */
export type UserModel = Model<
  IUser,
  Record<string, never>,
  IUserMethods,
  IUserVirtuals
>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<
  IUser,
  UserModel,
  IUserMethods,
  Record<string, never>,
  IUserVirtuals
>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name must be at most 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Must be a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "Role must be employee | manager | admin",
      },
      default: "employee",
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false, // sensitive — never returned in queries
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions(["password", "refreshToken"]),
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// email is already unique via `unique: true` above — Mongoose creates the index.

// Partial index: only index active users for role-based lookups.
userSchema.index(
  { role: 1, isActive: 1 },
  { name: "idx_user_role_active", partialFilterExpression: { isActive: true } },
);

// Manager tree traversal
userSchema.index({ managerId: 1 }, { name: "idx_user_manager" });

// Department filter (admin user-management screens)
userSchema.index(
  { department: 1, isActive: 1 },
  { name: "idx_user_dept_active" },
);

// refreshToken lookup on token rotation (hashed token stored here)
userSchema.index(
  { refreshToken: 1 },
  {
    name: "idx_user_refresh_token",
    sparse: true, // only index docs where refreshToken is not null
  },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

userSchema.virtual("fullName").get(function (this: UserDocument): string {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("maskedEmail").get(function (this: UserDocument): string {
  const [local, domain] = this.email.split("@");
  if (!local || !domain) return this.email;
  // j***e@company.com  (keep first + last char of local part)
  const masked =
    local.length <= 2
      ? `${local[0]}***`
      : `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}`;
  return `${masked}@${domain}`;
});

userSchema.virtual("isAdmin").get(function (this: UserDocument): boolean {
  return this.role === "admin";
});

userSchema.virtual("isManager").get(function (this: UserDocument): boolean {
  return this.role === "manager" || this.role === "admin";
});

// ─── Middleware ───────────────────────────────────────────────────────────────

/** Hash password before save when it has been modified. */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────

/**
 * Compares a plain-text candidate against the stored bcrypt hash.
 * Requires `.select('+password')` on the query for `this.password` to be set.
 */
userSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// ─── Model ────────────────────────────────────────────────────────────────────

export const User = model<IUser, UserModel>("User", userSchema);
