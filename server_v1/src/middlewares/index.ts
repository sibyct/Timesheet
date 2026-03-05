/**
 * @file middlewares/index.ts
 * @description Barrel export for all middleware modules.
 *
 * Import from here:
 *   import { authenticate, authorize, validate, errorHandler } from '@middlewares/index';
 */

// ── Auth ──────────────────────────────────────────────────────────────────────
export {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setRefreshCookie,
  clearRefreshCookie,
} from './auth.middleware';
export type {
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthenticatedUser,
} from './auth.middleware';

// ── Authorize ─────────────────────────────────────────────────────────────────
export {
  authorize,
  authorizeMinRole,
  authorizeOwnerOrAdmin,
} from './authorize.middleware';

// ── Validate ──────────────────────────────────────────────────────────────────
export {
  validate,
  mongoIdParam,
  userIdParam,
} from './validate.middleware';
export type { ValidationTargets } from './validate.middleware';

// ── Rate Limiters ─────────────────────────────────────────────────────────────
export {
  globalLimiter,
  authLimiter,
  apiLimiter,
  createLimiter,
} from './rateLimiter.middleware';

// ── Error Handling ────────────────────────────────────────────────────────────
export {
  notFound,
  errorHandler,
} from './error.middleware';
