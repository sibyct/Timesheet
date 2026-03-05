/**
 * @file modules/user/user.repository.ts
 * @description Data-access layer for the User collection.
 *
 * All Mongoose queries are isolated here.
 * Services call repository methods — never Mongoose directly.
 *
 * Naming conventions:
 *   find*  — returns null if not found (service decides whether to throw)
 *   get*   — alias used when the caller always expects a result
 *   create / update / softDelete — write operations
 */

import { Types } from "mongoose";
import { User } from "@models/index";
import type { IUser, UserDocument } from "@models/index";
import type { SortObject } from "@utils/pagination";
import type {
  CreateUserBody,
  UpdateUserBody,
  ListUsersQuery,
} from "./user.validator";

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * Finds a user by MongoDB _id.
 * Returns a lean plain object by default (no Mongoose overhead for reads).
 * Pass `withPassword: true` when verifying credentials.
 */
export async function findById(
  id: string,
  opts: { withPassword?: boolean; withRefreshToken?: boolean } = {},
): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  const extra: string[] = [];
  if (opts.withPassword) extra.push("+password");
  if (opts.withRefreshToken) extra.push("+refreshToken");

  const q = User.findById(id);
  return (extra.length ? q.select(extra.join(" ")) : q).lean();
}

/**
 * Finds a user by email address (case-insensitive via Mongoose `lowercase: true`).
 * Used during login and duplicate-email checks.
 */
export async function findByEmail(
  email: string,
  opts: { withPassword?: boolean } = {},
): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  const q = User.findOne({ email: email.toLowerCase() });
  return (opts.withPassword ? q.select("+password") : q).lean();
}

/** Returns the hydrated Mongoose document for operations that need instance methods. */
export async function findDocumentById(
  id: string,
): Promise<UserDocument | null> {
  // Cast required: Mongoose loses IUserMethods from the inferred type when
  // .select() is chained on findById, but the runtime document is correct.
  const doc = await User.findById(id).select("+password");
  return doc as UserDocument | null;
}

// ─── List ──────────────────────────────────────────────────────────────────────

export interface ListUsersFilter {
  role?: IUser["role"];
  department?: Types.ObjectId;
  isActive?: boolean;
  /** Text search against firstName, lastName, email */
  search?: string;
}

export interface ListUsersResult {
  users: (IUser & { _id: Types.ObjectId })[];
  total: number;
}

/**
 * Returns a paginated, filtered list of users.
 * Uses lean() for performance — these are read-only list results.
 */
export async function listUsers(
  query: ListUsersQuery,
  sort: SortObject,
): Promise<ListUsersResult> {
  const filter: Record<string, unknown> = {};

  if (query.role) filter["role"] = query.role;
  if (query.department)
    filter["department"] = new Types.ObjectId(query.department);
  if (query.isActive !== undefined) filter["isActive"] = query.isActive;

  if (query.search) {
    const regex = new RegExp(
      query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter["$or"] = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, total };
}

// ─── Write ─────────────────────────────────────────────────────────────────────

/** Creates a new user document. Returns the lean saved document. */
export async function createUser(
  data: CreateUserBody,
): Promise<IUser & { _id: Types.ObjectId }> {
  const doc = await User.create(data);
  // Return lean representation (strips password + refreshToken via toJSON)
  return doc.toObject();
}

/**
 * Updates a user by id with the given fields.
 * Returns the updated lean document, or null if not found.
 */
export async function updateUser(
  id: string,
  data: UpdateUserBody,
): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  return User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  ).lean();
}

/**
 * Soft-deletes a user by setting isActive = false.
 * Also clears the refresh token to invalidate any active sessions.
 */
export async function softDeleteUser(
  id: string,
): Promise<(IUser & { _id: Types.ObjectId }) | null> {
  return User.findByIdAndUpdate(
    id,
    { $set: { isActive: false, refreshToken: null } },
    { new: true },
  ).lean();
}

/**
 * Stores a hashed refresh token on the user document.
 * Pass null to clear (on logout or token rotation).
 * Used exclusively by the auth module.
 */
export async function updateRefreshToken(
  id: string,
  hashedToken: string | null,
): Promise<void> {
  await User.findByIdAndUpdate(id, { $set: { refreshToken: hashedToken } });
}

/** Records the timestamp of the most recent successful login. */
export async function touchLastLogin(id: string): Promise<void> {
  await User.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } });
}
