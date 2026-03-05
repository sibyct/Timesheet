/**
 * @file utils/ApiResponse.ts
 * @description Standardised API response builder and envelope types.
 *
 * All endpoints return one of two shapes:
 *
 *   Success:
 *   { success: true,  message: string, data: T }
 *
 *   Paginated success:
 *   { success: true,  message: string, data: T[], meta: PaginationMeta }
 *
 *   Error (sent by the error handler middleware, not here):
 *   { success: false, message: string, errors?: FieldError[] }
 *
 * Usage in a controller:
 *   res.status(200).json(ApiResponse.success(data, 'User retrieved'));
 *   res.status(201).json(ApiResponse.created(user, 'User created'));
 *   res.status(200).json(ApiResponse.paginated(users, meta, 'Users retrieved'));
 */

import type { Response } from 'express';
import type { FieldError } from './ApiError';

// ─── Envelope Types ───────────────────────────────────────────────────────────

export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface SuccessEnvelope<T> {
  success: true;
  message: string;
  data:    T;
}

export interface PaginatedEnvelope<T> {
  success: true;
  message: string;
  data:    T[];
  meta:    PaginationMeta;
}

export interface ErrorEnvelope {
  success: false;
  message: string;
  errors?: FieldError[];
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export class ApiResponse {
  /**
   * Sends a 200 OK JSON response with the standard success envelope.
   *
   * @param res     - Express Response object
   * @param data    - Payload to include in `data`
   * @param message - Human-readable success message (default: "Success")
   */
  static ok<T>(res: Response, data: T, message = 'Success'): Response {
    return res.status(200).json({
      success: true,
      message,
      data,
    } satisfies SuccessEnvelope<T>);
  }

  /**
   * Sends a 201 Created JSON response.
   *
   * @param res     - Express Response object
   * @param data    - Newly created resource
   * @param message - Human-readable success message (default: "Created successfully")
   */
  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return res.status(201).json({
      success: true,
      message,
      data,
    } satisfies SuccessEnvelope<T>);
  }

  /**
   * Sends a 204 No Content response (no body).
   * Used for DELETE and some PATCH endpoints that return nothing.
   *
   * @param res - Express Response object
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Sends a 200 OK paginated response with `data[]` + `meta` object.
   *
   * @param res     - Express Response object
   * @param data    - Array of items for the current page
   * @param meta    - Pagination metadata
   * @param message - Human-readable success message
   */
  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message = 'Retrieved successfully',
  ): Response {
    return res.status(200).json({
      success: true,
      message,
      data,
      meta,
    } satisfies PaginatedEnvelope<T>);
  }

  /**
   * Builds the error envelope shape (used by the error handler middleware,
   * not sent directly from controllers).
   *
   * @param message - Error message
   * @param errors  - Optional per-field validation errors
   */
  static buildError(message: string, errors?: FieldError[]): ErrorEnvelope {
    const envelope: ErrorEnvelope = { success: false, message };
    if (errors && errors.length > 0) {
      envelope.errors = errors;
    }
    return envelope;
  }
}
