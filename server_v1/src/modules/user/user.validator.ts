/**
 * @file modules/user/user.validator.ts
 * @description Zod schemas for the Users module.
 *
 * Schemas:
 *   createUserSchema      — POST /users          (admin)
 *   updateUserSchema      — PATCH /users/:id     (admin — all fields)
 *   updateMeSchema        — PATCH /users/me      (self  — limited fields)
 *   changePasswordSchema  — POST /users/me/change-password
 *   listUsersQuerySchema  — GET  /users          (filters + pagination)
 */

import { z } from "zod";
import { USER_ROLES } from "@models/index";

// ─── Reusable field definitions ───────────────────────────────────────────────

const firstName = z
  .string({ required_error: "First name is required" })
  .trim()
  .min(2, "First name must be at least 2 characters")
  .max(50, "First name cannot exceed 50 characters");

const lastName = z
  .string({ required_error: "Last name is required" })
  .trim()
  .min(2, "Last name must be at least 2 characters")
  .max(50, "Last name cannot exceed 50 characters");

const email = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Must be a valid email address");

const password = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password cannot exceed 72 characters") // bcrypt silently truncates at 72
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  );

const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID — must be a 24-character hex string");

// ─── createUserSchema ─────────────────────────────────────────────────────────

/** Body schema for POST /users (admin only). */
export const createUserSchema = z.object({
  firstName,
  lastName,
  email,
  password,
  role: z
    .enum(USER_ROLES, {
      errorMap: () => ({
        message: `Role must be one of: ${USER_ROLES.join(", ")}`,
      }),
    })
    .default("employee"),
  department: mongoId,
  managerId: mongoId.nullable().optional().default(null),
  hourlyRate: z
    .number({ invalid_type_error: "Hourly rate must be a number" })
    .min(0, "Hourly rate cannot be negative")
    .default(0),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;

// ─── updateUserSchema ─────────────────────────────────────────────────────────

/**
 * Body schema for PATCH /users/:id (admin).
 * All fields optional — only provided fields are updated.
 */
export const updateUserSchema = z
  .object({
    firstName: firstName.optional(),
    lastName: lastName.optional(),
    email: email.optional(),
    role: z
      .enum(USER_ROLES, {
        errorMap: () => ({
          message: `Role must be one of: ${USER_ROLES.join(", ")}`,
        }),
      })
      .optional(),
    department: mongoId.optional(),
    managerId: mongoId.nullable().optional(),
    hourlyRate: z
      .number({ invalid_type_error: "Hourly rate must be a number" })
      .min(0, "Hourly rate cannot be negative")
      .optional(),
    isActive: z
      .boolean({ invalid_type_error: "isActive must be a boolean" })
      .optional(),
  })
  .strict();

export type UpdateUserBody = z.infer<typeof updateUserSchema>;

// ─── updateMeSchema ───────────────────────────────────────────────────────────

/**
 * Body schema for PATCH /users/me (self-service).
 * Employees can only change their own name — not role, department, or rate.
 */
export const updateMeSchema = z
  .object({
    firstName: firstName.optional(),
    lastName: lastName.optional(),
  })
  .strict();

export type UpdateMeBody = z.infer<typeof updateMeSchema>;

// ─── changePasswordSchema ─────────────────────────────────────────────────────

/** Body schema for POST /users/me/change-password. */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(1),
    newPassword: password,
    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"],
  });

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

// ─── listUsersQuerySchema ─────────────────────────────────────────────────────

/** Query schema for GET /users. */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  department: mongoId.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  search: z.string().trim().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
