/**
 * HTTP layer configuration.
 *
 * Centralises every tunable that the HTTP interceptors, services, and
 * retry/timeout operators depend on.  Import directly — no injection needed.
 *
 * @example
 * import { HTTP_CONFIG } from '@core/config/http/http.config';
 *
 * if (elapsed > HTTP_CONFIG.performance.slowThreshold) { … }
 */
export const HTTP_CONFIG = {
  // ── Performance monitoring ─────────────────────────────────────────────────
  performance: {
    /** Requests that take longer than this (ms) are flagged as slow. */
    slowThreshold: 2_000,
  },

  // ── Timeouts ───────────────────────────────────────────────────────────────
  timeout: {
    /** Default request timeout in ms before an error is thrown. */
    default: 30_000,
    /** Timeout for file upload/download requests. */
    upload: 120_000,
  },

  // ── Retry policy ──────────────────────────────────────────────────────────
  retry: {
    /** Maximum number of automatic retry attempts. */
    maxAttempts: 3,
    /** Base delay between retries in ms (doubles with each attempt). */
    baseDelayMs: 500,
    /** HTTP status codes that are safe to retry automatically. */
    retryableStatuses: [408, 429, 502, 503, 504] as number[],
  },

  // ── Cache ──────────────────────────────────────────────────────────────────
  cache: {
    /** Default TTL for cached responses in ms (5 minutes). */
    ttlMs: 5 * 60 * 1_000,
    /** Maximum number of cached entries before eviction. */
    maxEntries: 100,
  },

  // ── Headers ────────────────────────────────────────────────────────────────
  headers: {
    contentType: 'application/json',
    accept:      'application/json',
  },
} as const;

export type HttpConfig = typeof HTTP_CONFIG;
