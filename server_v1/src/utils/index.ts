/**
 * @file utils/index.ts
 * @description Barrel export for all shared utility modules.
 *
 * Import from here:
 *   import { ApiError, ApiResponse, catchAsync, parsePaginationQuery } from '@utils/index';
 */

// ── Error ─────────────────────────────────────────────────────────────────────
export { ApiError }             from './ApiError';
export type { FieldError }      from './ApiError';

// ── Response ──────────────────────────────────────────────────────────────────
export { ApiResponse }          from './ApiResponse';
export type {
  PaginationMeta,
  SuccessEnvelope,
  PaginatedEnvelope,
  ErrorEnvelope,
}                               from './ApiResponse';

// ── Async Wrapper ─────────────────────────────────────────────────────────────
export { catchAsync }           from './catchAsync';

// ── Pagination ────────────────────────────────────────────────────────────────
export {
  parsePaginationQuery,
  buildPaginationMeta,
  buildSkipTake,
  buildSortStage,
  buildSort,
  applyPagination,
  PAGINATION_DEFAULTS,
}                               from './pagination';
export type {
  PaginationOptions,
  SkipTake,
  SortObject,
}                               from './pagination';
