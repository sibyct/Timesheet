/**
 * @file middlewares/validate.middleware.ts
 * @description Zod-powered request validation middleware factory.
 *
 * Validates req.body, req.query, and/or req.params against a Zod schema.
 * On failure, throws a 422 ApiError with per-field error messages that match
 * the standard ErrorEnvelope shape.
 *
 * Usage:
 *   router.post('/login',
 *     validate({ body: loginSchema }),
 *     catchAsync(authController.login),
 *   );
 *
 *   router.get('/users',
 *     authenticate,
 *     validate({ query: listUsersQuerySchema }),
 *     catchAsync(userController.list),
 *   );
 *
 *   router.patch('/users/:id',
 *     authenticate,
 *     validate({ params: userIdParamSchema, body: updateUserSchema }),
 *     catchAsync(userController.update),
 *   );
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema, ZodError } from "zod";
import { ApiError, type FieldError } from "@utils/ApiError";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationTargets {
  /** Validates and replaces req.body with the parsed result */
  body?: ZodSchema;
  /** Validates and replaces req.query with the parsed result */
  query?: ZodSchema;
  /** Validates and replaces req.params with the parsed result */
  params?: ZodSchema;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a ZodError into the FieldError[] shape expected by ApiError.validation().
 *
 * Zod's `issues` array contains structured error info per path.
 * We flatten each issue into { field: "address.city", message: "Required" }.
 */
function zodToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    // Join nested path segments with dots: ["address", "city"] → "address.city"
    field: issue.path.length > 0 ? issue.path.join(".") : "_root",
    message: issue.message,
  }));
}

// ─── validate ─────────────────────────────────────────────────────────────────

/**
 * Middleware factory that validates one or more parts of the request.
 *
 * Uses Zod's `safeParse` (never throws) so errors are always caught
 * and converted to a 422 ApiError — never an unhandled rejection.
 *
 * Mutations:
 *   - Replaces `req.body`   with the Zod-parsed (coerced/stripped) output
 *   - Replaces `req.query`  with the Zod-parsed output
 *   - Replaces `req.params` with the Zod-parsed output
 *
 * This ensures downstream controllers receive typed, coerced values
 * (e.g. numeric strings coerced to numbers by z.coerce.number()).
 *
 * @param targets - Object specifying which schemas to apply to which sources
 */
export function validate(targets: ValidationTargets): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const allErrors: FieldError[] = [];

    // ── body ────────────────────────────────────────────────────────────────
    if (targets.body) {
      const result = targets.body.safeParse(req.body);
      if (!result.success) {
        allErrors.push(
          ...zodToFieldErrors(result.error).map((e) => ({
            ...e,
            field: `body.${e.field}`,
          })),
        );
      } else {
        // Replace with parsed output (coerced values, stripped unknown keys).
        // Cast through unknown: result.data is `any` from the untyped ZodSchema
        // generic; the explicit cast makes the unsafe assignment intentional.
        (req as { body: unknown }).body = result.data as unknown;
      }
    }

    // ── query ───────────────────────────────────────────────────────────────
    if (targets.query) {
      const result = targets.query.safeParse(req.query);
      if (!result.success) {
        allErrors.push(
          ...zodToFieldErrors(result.error).map((e) => ({
            ...e,
            field: `query.${e.field}`,
          })),
        );
      } else {
        // req.query is normally read-only; cast to allow mutation
        (req as { query: unknown }).query = result.data;
      }
    }

    // ── params ──────────────────────────────────────────────────────────────
    if (targets.params) {
      const result = targets.params.safeParse(req.params);
      if (!result.success) {
        allErrors.push(
          ...zodToFieldErrors(result.error).map((e) => ({
            ...e,
            field: `params.${e.field}`,
          })),
        );
      } else {
        req.params = result.data as typeof req.params;
      }
    }

    if (allErrors.length > 0) {
      return next(ApiError.validation(allErrors));
    }

    next();
  };
}

// ─── Common Param Schemas ─────────────────────────────────────────────────────
// Shared across multiple routers to avoid repetition.

import { z } from "zod";

/**
 * Validates that `req.params.id` is a valid 24-character MongoDB ObjectId hex string.
 *
 * @example
 * router.get('/:id', validate({ params: mongoIdParam }), handler);
 */
export const mongoIdParam = z.object({
  id: z
    .string()
    .regex(
      /^[a-f\d]{24}$/i,
      "Invalid ID format — must be a 24-character hex string",
    ),
});

/**
 * Validates that `req.params.userId` is a valid MongoDB ObjectId.
 */
export const userIdParam = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
});
