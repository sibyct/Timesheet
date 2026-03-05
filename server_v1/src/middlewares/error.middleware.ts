/**
 * @file middlewares/error.middleware.ts
 * @description Central error-handling middleware.
 *
 * Two middlewares must be registered as the LAST two in app.ts:
 *
 *   1. notFound      — catches requests to unknown routes, creates a 404 ApiError
 *   2. errorHandler  — converts any Error (ApiError or unexpected) into a
 *                      standardised JSON error response
 *
 * Decision tree in errorHandler:
 *   ApiError + isOperational = true   → send real message + field errors
 *   ApiError + isOperational = false  → log full stack, send generic message
 *   Mongoose ValidationError          → coerce to 422 with field errors
 *   Mongoose CastError (bad ObjectId) → coerce to 400
 *   Mongoose duplicate key (11000)    → coerce to 409 Conflict
 *   Everything else                   → 500, generic message in prod
 */

import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { ApiError, type FieldError } from '@utils/ApiError';
import { ApiResponse } from '@utils/ApiResponse';
import { createLogger } from '@config/logger';
import { isDev } from '@config/env';

const log = createLogger('error-handler');

// ─── notFound ─────────────────────────────────────────────────────────────────

/**
 * 404 handler — must be registered AFTER all route handlers.
 * Forwards a 404 ApiError to the central error handler.
 */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl}`));
}

// ─── Coercion Helpers ─────────────────────────────────────────────────────────

/** Converts a Mongoose ValidationError into FieldError[] */
function mongooseValidationToFieldErrors(
  err: mongoose.Error.ValidationError,
): FieldError[] {
  return Object.values(err.errors).map((e) => ({
    field:   e.path,
    message: e.message,
  }));
}

/** Extracts the duplicate field name from a MongoDB 11000 error message */
function extractDuplicateField(message: string): string {
  // MongoDB error message format: "...index: email_1 dup key: { email: "foo" }"
  const match = /index: (\S+) dup key/.exec(message);
  if (match?.[1]) {
    // Strip the index suffix (e.g. "email_1" → "email")
    return match[1].replace(/_\d+$/, '');
  }
  return 'field';
}

// ─── normaliseError ────────────────────────────────────────────────────────────

/**
 * Converts any thrown value into a structured ApiError.
 * This is the single place where all error types are normalised.
 */
function normaliseError(err: unknown): ApiError {
  // Already an ApiError — pass through
  if (err instanceof ApiError) return err;

  // ── Zod validation ──────────────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const fields: FieldError[] = err.issues.map((i) => ({
      field:   i.path.join('.') || '_root',
      message: i.message,
    }));
    return ApiError.validation(fields);
  }

  // ── JWT errors ──────────────────────────────────────────────────────────────
  if (err instanceof TokenExpiredError) {
    return ApiError.unauthorized('Token has expired');
  }
  if (err instanceof JsonWebTokenError) {
    return ApiError.unauthorized('Invalid token');
  }

  // ── Mongoose ValidationError (schema-level) ─────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    return ApiError.validation(mongooseValidationToFieldErrors(err));
  }

  // ── Mongoose CastError (bad ObjectId in params) ──────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for field '${err.path}'`);
  }

  // ── MongoDB duplicate key error (code 11000) ─────────────────────────────────
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  ) {
    const message = 'message' in err ? String((err as { message: string }).message) : '';
    const field   = extractDuplicateField(message);
    return ApiError.conflict(`A record with this ${field} already exists`);
  }

  // ── Unknown / programmer error ───────────────────────────────────────────────
  const message = err instanceof Error ? err.message : 'Internal server error';
  return new ApiError(500, message, [], false);
}

// ─── errorHandler ─────────────────────────────────────────────────────────────

/**
 * Central error handler — must be the LAST middleware registered in app.ts.
 *
 * Express identifies 4-argument middleware as error handlers;
 * the unused `_next` parameter must be declared to satisfy that signature.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const apiError = normaliseError(err);

  // ── Logging ──────────────────────────────────────────────────────────────────
  if (!apiError.isOperational) {
    // Programmer / unexpected error — log the full stack for investigation
    log.error(
      {
        err,
        requestId: req.id,
        method:    req.method,
        url:       req.originalUrl,
        userId:    req.user?.id,
      },
      'Unhandled non-operational error',
    );
  } else if (apiError.statusCode >= 500) {
    log.error({ err: apiError, requestId: req.id }, apiError.message);
  } else if (apiError.statusCode >= 400) {
    log.warn(
      { statusCode: apiError.statusCode, message: apiError.message, requestId: req.id },
      'Client error',
    );
  }

  // ── Response ─────────────────────────────────────────────────────────────────
  const statusCode = apiError.statusCode;

  // In production, never leak programmer error messages to the client
  const message =
    !apiError.isOperational && !isDev
      ? 'Internal server error'
      : apiError.message;

  res
    .status(statusCode)
    .json(ApiResponse.buildError(message, apiError.errors.length > 0 ? apiError.errors : undefined));
}
