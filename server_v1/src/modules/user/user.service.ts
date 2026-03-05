/**
 * @file modules/user/user.service.ts
 * @description Business logic for the Users module.
 *
 * Rules:
 *   - Never returns raw Mongoose documents — always plain objects or lean results.
 *   - All 404 / 409 / 403 errors are thrown here; controllers stay thin.
 *   - Password hashing is delegated to the User model's pre-save hook.
 *   - Change-password verifies the old password via comparePassword() on the
 *     hydrated document (requires select('+password')).
 */

import { ApiError } from "@utils/ApiError";
import { buildPaginationMeta, buildSortStage } from "@utils/pagination";
import type { PaginationMeta } from "@utils/ApiResponse";
import type { IUser } from "@models/index";
import type { Types } from "mongoose";
import * as repo from "./user.repository";
import type {
  CreateUserBody,
  UpdateUserBody,
  UpdateMeBody,
  ChangePasswordBody,
  ListUsersQuery,
} from "./user.validator";

// ─── Allowed sort fields ───────────────────────────────────────────────────────

const SORTABLE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "role",
  "createdAt",
  "hourlyRate",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserDto = IUser & { _id: Types.ObjectId };

export interface PaginatedUsers {
  users: UserDto[];
  meta: PaginationMeta;
}

// ─── listUsers ────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of users.
 * Admin-only endpoint — no additional ownership filter applied here.
 *
 * @param query  — Validated + coerced query params (page, limit, filters, sort)
 * @param rawSort — Raw `sort` query string (e.g. "createdAt:desc")
 */
export async function listUsers(
  query: ListUsersQuery,
  rawSort: string | undefined,
): Promise<PaginatedUsers> {
  const sortObj = rawSort
    ? buildSortStage(
        { query: { sort: rawSort } } as unknown as Parameters<
          typeof buildSortStage
        >[0],
        SORTABLE_FIELDS,
      )
    : { createdAt: -1 as const };

  const { users, total } = await repo.listUsers(query, sortObj);
  const meta = buildPaginationMeta(total, {
    page: query.page,
    limit: query.limit,
  });

  return { users, meta };
}

// ─── getUserById ──────────────────────────────────────────────────────────────

/**
 * Returns a single user by id.
 * Throws 404 if not found.
 */
export async function getUserById(id: string): Promise<UserDto> {
  const user = await repo.findById(id);
  if (!user) throw ApiError.notFound("User");
  return user;
}

// ─── createUser ───────────────────────────────────────────────────────────────

/**
 * Creates a new user.
 * Checks for duplicate email before inserting (provides a clear 409 error
 * instead of relying on the MongoDB unique index violation message).
 */
export async function createUser(body: CreateUserBody): Promise<UserDto> {
  const existing = await repo.findByEmail(body.email);
  if (existing) {
    throw ApiError.conflict(`A user with email '${body.email}' already exists`);
  }

  return repo.createUser(body);
}

// ─── updateUser ───────────────────────────────────────────────────────────────

/**
 * Updates a user (admin operation — all fields allowed).
 * Throws 404 if not found.
 * Throws 409 if the new email is already taken by another user.
 */
export async function updateUser(
  id: string,
  body: UpdateUserBody,
): Promise<UserDto> {
  if (body.email) {
    const existing = await repo.findByEmail(body.email);
    if (existing && String(existing._id) !== id) {
      throw ApiError.conflict(`Email '${body.email}' is already in use`);
    }
  }

  const updated = await repo.updateUser(id, body);
  if (!updated) throw ApiError.notFound("User");

  return updated;
}

// ─── updateMe ─────────────────────────────────────────────────────────────────

/**
 * Self-service profile update.
 * Only firstName and lastName — no role/department/rate changes allowed.
 * Throws 404 if user no longer exists (edge case: deleted between auth and here).
 */
export async function updateMe(
  id: string,
  body: UpdateMeBody,
): Promise<UserDto> {
  const updated = await repo.updateUser(id, body);
  if (!updated) throw ApiError.notFound("User");
  return updated;
}

// ─── deleteUser ───────────────────────────────────────────────────────────────

/**
 * Soft-deletes a user (sets isActive = false, clears refreshToken).
 * Throws 404 if not found.
 * Does not hard-delete to preserve audit history.
 */
export async function deleteUser(id: string): Promise<void> {
  const user = await repo.findById(id);
  if (!user) throw ApiError.notFound("User");

  await repo.softDeleteUser(id);
}

// ─── changePassword ───────────────────────────────────────────────────────────

/**
 * Changes the authenticated user's own password.
 *
 * Steps:
 *   1. Load the hydrated document with password selected
 *   2. Verify currentPassword against the stored bcrypt hash
 *   3. Set the new password (model pre-save hook rehashes it)
 *   4. Clear refreshToken to invalidate all existing sessions
 *
 * @throws 401 if currentPassword is wrong
 * @throws 404 if the user no longer exists
 */
export async function changePassword(
  userId: string,
  body: ChangePasswordBody,
): Promise<void> {
  const doc = await repo.findDocumentById(userId);
  if (!doc) throw ApiError.notFound("User");

  const valid = await doc.comparePassword(body.currentPassword);
  if (!valid) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  // Setting doc.password triggers the pre-save bcrypt hook
  doc.password = body.newPassword;
  doc.refreshToken = null; // invalidate all existing sessions
  await doc.save();
}
