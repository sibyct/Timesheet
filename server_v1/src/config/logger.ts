/**
 * @file logger.ts
 * @description Singleton Pino logger instance with environment-aware transport.
 *
 * - Development: pretty-printed via pino-pretty
 * - Production / Staging: JSON to stdout (consumed by log aggregator)
 * - Test: silent (suppresses noise in Jest output)
 */

import pino from "pino";
import { env, isDev, isTest } from "./env";

// ─── Transport ────────────────────────────────────────────────────────────────

/**
 * Builds the Pino transport configuration.
 * pino-pretty is only loaded in development to avoid a production dependency.
 */
function buildTransport(): pino.TransportSingleOptions | undefined {
  if (isTest) return undefined; // silent — no output during tests

  if (isDev) {
    return {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
        singleLine: false,
        messageFormat: "{msg}",
      },
    };
  }

  // Production / staging: structured JSON — no extra transport needed
  return undefined;
}

// ─── Redaction ────────────────────────────────────────────────────────────────

/**
 * Paths to redact from log output.
 * Prevents accidental logging of secrets at any log level.
 */
const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
  "*.password",
  "*.refreshToken",
  "*.accessToken",
  "*.token",
  "*.secret",
];

// ─── Logger ───────────────────────────────────────────────────────────────────

export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,

  // ISO timestamp in all environments
  timestamp: pino.stdTimeFunctions.isoTime,

  // Merge req.id into every log line produced within a request context
  mixin: () => ({}),

  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },

  // Structured serialisers for Express req/res objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },

  transport: buildTransport(),
});

/** Child logger factory — attaches a `module` label to each child. */
export function createLogger(module: string): pino.Logger {
  return logger.child({ module });
}

export type Logger = pino.Logger;
