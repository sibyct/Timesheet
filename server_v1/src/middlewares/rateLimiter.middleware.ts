/**
 * @file middlewares/rateLimiter.middleware.ts
 * @description Tiered express-rate-limit middleware instances.
 *
 * Three tiers:
 *   globalLimiter  — applied to ALL routes in app.ts (100 req / 15 min per IP)
 *   authLimiter    — applied only to auth routes   (10  req / 15 min per IP)
 *   apiLimiter     — applied to expensive endpoints (30  req / 1 min  per IP)
 *
 * All limits are driven by env vars so they can be tuned per environment
 * without a code change.
 *
 * `createLimiter` is an escape-hatch factory for one-off custom limits.
 */

import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '@config/env';
import type { Request, Response } from 'express';

// ─── Standard Error Response ──────────────────────────────────────────────────

/**
 * Returns the standard ErrorEnvelope shape for rate-limit responses.
 * Kept here to avoid importing ApiResponse (which imports from utils)
 * into a middleware that runs before most other code is loaded.
 */
function rateLimitMessage(message: string) {
  return (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      message,
      errors: [],
    });
  };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a rate limiter with the given options merged over the project defaults.
 *
 * @param options - express-rate-limit options (partial)
 * @param message - Human-readable message sent on 429
 */
export function createLimiter(
  options: Partial<Options>,
  message = 'Too many requests — please try again later',
): RateLimitRequestHandler {
  return rateLimit({
    standardHeaders: true,   // Return `RateLimit-*` headers (RFC 6585)
    legacyHeaders:   false,  // Suppress `X-RateLimit-*` headers
    skip: (req) => req.path === '/health',
    handler: rateLimitMessage(message),
    ...options,
  });
}

// ─── Preset Limiters ──────────────────────────────────────────────────────────

/**
 * Global limiter — mounted on ALL routes in app.ts.
 * Configured via RATE_LIMIT_WINDOW_MS + RATE_LIMIT_MAX env vars.
 */
export const globalLimiter: RateLimitRequestHandler = createLimiter(
  {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max:      env.RATE_LIMIT_MAX,
  },
  'Too many requests — please try again in a few minutes',
);

/**
 * Auth limiter — stricter, applied only to login + refresh-token routes.
 * Configured via AUTH_RATE_LIMIT_MAX env var (default 10 per 15 min).
 * Prevents credential-stuffing and brute-force attacks.
 */
export const authLimiter: RateLimitRequestHandler = createLimiter(
  {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max:      env.AUTH_RATE_LIMIT_MAX,
    // Use a dedicated key prefix so auth limits don't share counters with global
    keyGenerator: (req) => `auth:${req.ip ?? 'unknown'}`,
  },
  'Too many authentication attempts — please try again later',
);

/**
 * API limiter — applied to expensive report / export endpoints.
 * 30 requests per minute per IP.
 */
export const apiLimiter: RateLimitRequestHandler = createLimiter(
  {
    windowMs: 60_000, // 1 minute
    max:      30,
    keyGenerator: (req) => `api:${req.ip ?? 'unknown'}`,
  },
  'Request rate exceeded — please slow down',
);
