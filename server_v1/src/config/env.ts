/**
 * @file env.ts
 * @description Typed, validated environment configuration using Zod.
 *
 * Import this module — never `process.env` directly — everywhere in the app.
 * Fails fast at startup if any required variable is missing or malformed.
 */

import { z } from 'zod';
import path from 'path';

// Load .env file only in non-production environments.
// In production, environment variables are injected by the platform/runtime.
if (process.env['NODE_ENV'] !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'staging', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),

  // MongoDB
  MONGO_URI: z.string().url('MONGO_URI must be a valid URI'),
  MONGO_POOL_MAX: z.coerce.number().int().positive().default(50),
  MONGO_POOL_MIN: z.coerce.number().int().nonnegative().default(10),

  // Redis
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),
  REDIS_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:4200'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),

  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
});

// ─── Parse & Export ───────────────────────────────────────────────────────────

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  const formatted = _parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');

  // Use process.stderr directly — logger is not yet initialised at this point.
  process.stderr.write(
    `\n[ENV] Invalid environment variables:\n${formatted}\n\n`,
  );
  process.exit(1);
}

/** Fully typed, validated environment configuration. */
export const env = _parsed.data;

/** Derived helpers */
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * Parses the CORS_ORIGINS env variable into an array of allowed origins.
 * Supports wildcard `*` as a single value.
 */
export const corsOrigins: string[] = env.CORS_ORIGINS.split(',').map((o) =>
  o.trim(),
);

export type Env = z.infer<typeof envSchema>;
