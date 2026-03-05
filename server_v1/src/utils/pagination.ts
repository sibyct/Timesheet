/**
 * @file utils/pagination.ts
 * @description Cursor-safe, offset-based pagination helpers.
 *
 * Provides:
 *   parsePaginationQuery  — extract + validate page/limit from req.query
 *   buildPaginationMeta   — compute PaginationMeta from count + options
 *   buildSkipTake         — convert page/limit → { skip, limit } for Mongoose
 *   buildSortStage        — convert "field:asc" strings → Mongoose sort object
 *
 * All list endpoints use these helpers for a consistent pagination contract:
 *   GET /users?page=2&limit=20&sort=createdAt:desc
 *   → { data[], meta: { total, page, limit, totalPages, hasNext, hasPrev } }
 */

import type { Request } from 'express';
import type { PaginationMeta } from './ApiResponse';
import { ApiError } from './ApiError';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PAGINATION_DEFAULTS = {
  PAGE:      1,
  LIMIT:     10,
  MAX_LIMIT: 100,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationOptions {
  page:  number;
  limit: number;
}

export interface SkipTake {
  skip:  number;
  limit: number;
}

/** Mongoose-compatible sort object e.g. { createdAt: -1, name: 1 } */
export type SortObject = Record<string, 1 | -1>;

// ─── parsePaginationQuery ─────────────────────────────────────────────────────

/**
 * Extracts and validates `page` and `limit` from Express query parameters.
 *
 * Defaults:  page = 1, limit = 10
 * Hard cap:  limit ≤ 100 (prevents runaway queries)
 *
 * @param req - Express Request (reads req.query.page and req.query.limit)
 * @throws ApiError 400 if page or limit are not positive integers
 */
export function parsePaginationQuery(req: Request): PaginationOptions {
  const rawPage  = req.query['page'];
  const rawLimit = req.query['limit'];

  const page  = rawPage  ? parseInt(String(rawPage),  10) : PAGINATION_DEFAULTS.PAGE;
  const limit = rawLimit ? parseInt(String(rawLimit), 10) : PAGINATION_DEFAULTS.LIMIT;

  if (isNaN(page) || page < 1) {
    throw ApiError.badRequest('Query param "page" must be a positive integer');
  }
  if (isNaN(limit) || limit < 1) {
    throw ApiError.badRequest('Query param "limit" must be a positive integer');
  }
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    throw ApiError.badRequest(
      `Query param "limit" cannot exceed ${PAGINATION_DEFAULTS.MAX_LIMIT}`,
    );
  }

  return { page, limit };
}

// ─── buildPaginationMeta ──────────────────────────────────────────────────────

/**
 * Computes the full PaginationMeta object from the total document count
 * and the current page/limit options.
 *
 * @param total   - Total number of documents matching the query (from countDocuments)
 * @param options - Current page and limit values
 *
 * @example
 * const meta = buildPaginationMeta(243, { page: 3, limit: 20 });
 * // { total: 243, page: 3, limit: 20, totalPages: 13, hasNext: true, hasPrev: true }
 */
export function buildPaginationMeta(
  total: number,
  options: PaginationOptions,
): PaginationMeta {
  const { page, limit } = options;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ─── buildSkipTake ────────────────────────────────────────────────────────────

/**
 * Converts page/limit pagination options to MongoDB skip + limit values.
 *
 * @param options - Validated page and limit
 *
 * @example
 * buildSkipTake({ page: 3, limit: 20 }) // → { skip: 40, limit: 20 }
 */
export function buildSkipTake(options: PaginationOptions): SkipTake {
  return {
    skip:  (options.page - 1) * options.limit,
    limit: options.limit,
  };
}

// ─── buildSortStage ───────────────────────────────────────────────────────────

/**
 * Parses the `sort` query parameter into a Mongoose sort object.
 *
 * Accepted format: comma-separated "field:direction" pairs.
 *   sort=createdAt:desc,name:asc
 *   → { createdAt: -1, name: 1 }
 *
 * Defaults to `{ createdAt: -1 }` when no sort is supplied.
 * Unknown fields are silently ignored to prevent exposing internal field names
 * (enforce an allowlist in the calling service if needed).
 *
 * @param req           - Express Request
 * @param allowedFields - Optional allowlist of sortable field names
 * @param defaultSort   - Fallback sort object (default: { createdAt: -1 })
 *
 * @example
 * buildSortStage(req, ['name', 'createdAt', 'hourlyRate'])
 * // req.query.sort = "name:asc,hourlyRate:desc"
 * // → { name: 1, hourlyRate: -1 }
 */
export function buildSortStage(
  req: Request,
  allowedFields?: string[],
  defaultSort: SortObject = { createdAt: -1 },
): SortObject {
  const rawSort = req.query['sort'];
  if (!rawSort || typeof rawSort !== 'string') return defaultSort;

  const result: SortObject = {};

  for (const token of rawSort.split(',')) {
    const [field, direction] = token.trim().split(':');

    if (!field) continue;

    // Allowlist check (skip if field is not in the allowed set)
    if (allowedFields && !allowedFields.includes(field)) continue;

    // Reject field names that look like injection attempts
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(field)) continue;

    result[field] = direction?.toLowerCase() === 'asc' ? 1 : -1;
  }

  return Object.keys(result).length > 0 ? result : defaultSort;
}

// ─── applyPagination (convenience) ───────────────────────────────────────────

/**
 * Convenience wrapper: parses pagination + sort from the request in one call.
 * Returns everything a repository method needs.
 *
 * @param req           - Express Request
 * @param allowedSortFields - Allowlist for sort fields
 * @param defaultSort   - Default sort (default: { createdAt: -1 })
 */
export function applyPagination(
  req: Request,
  allowedSortFields?: string[],
  defaultSort?: SortObject,
): PaginationOptions & { skip: number; sort: SortObject } {
  const opts    = parsePaginationQuery(req);
  const { skip } = buildSkipTake(opts);
  const sort    = buildSortStage(req, allowedSortFields, defaultSort);

  return { ...opts, skip, sort };
}
