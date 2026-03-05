/**
 * @file server.ts
 * @description Application entry point.
 *
 * Responsibilities:
 * - Register global unhandledRejection + uncaughtException handlers FIRST
 * - Connect to MongoDB and Redis
 * - Create the Express app
 * - Start the HTTP server
 * - Implement graceful shutdown on SIGTERM / SIGINT
 */

// ── Global error handlers — must be first ─────────────────────────────────────
// These catch crashes in any async context before the logger is ready,
// so we fall back to process.stderr.
process.on("uncaughtException", (err: Error) => {
  process.stderr.write(
    `[FATAL] Uncaught exception: ${err.stack ?? err.message}\n`,
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  const msg =
    reason instanceof Error ? (reason.stack ?? reason.message) : String(reason);
  process.stderr.write(`[FATAL] Unhandled rejection: ${msg}\n`);
  process.exit(1);
});

// ── Imports ───────────────────────────────────────────────────────────────────
import http from "http";
import { createApp } from "./app";
import { connectDB, disconnectDB } from "@config/db";
import { getRedisClient, disconnectRedis } from "@config/redis";
import { env } from "@config/env";
import { logger } from "@config/logger";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  // 1. Connect infrastructure
  logger.info("Bootstrapping Timesheet API…");

  await connectDB();

  // Eagerly initialise the Redis client so connection errors surface at startup
  getRedisClient();

  // 2. Build Express app
  const app = createApp();

  // 3. Create HTTP server (kept separate from app so we can close it gracefully)
  const server = http.createServer(app);

  // 4. Start listening
  server.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        apiBase: `http://localhost:${env.PORT}${env.API_PREFIX}/${env.API_VERSION}`,
        docs: `http://localhost:${env.PORT}/api-docs`,
        health: `http://localhost:${env.PORT}/health`,
      },
      "HTTP server listening",
    );
  });

  // 5. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutdown signal received — draining connections…");

    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, "Error closing HTTP server");
        process.exit(1);
      }

      try {
        await Promise.all([disconnectDB(), disconnectRedis()]);
        logger.info("Graceful shutdown complete");
        process.exit(0);
      } catch (shutdownErr) {
        logger.error({ err: shutdownErr }, "Error during graceful shutdown");
        process.exit(1);
      }
    });

    // Force-kill after 10 s if connections refuse to drain
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((err: unknown) => {
  const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`[FATAL] Bootstrap failed: ${msg}\n`);
  process.exit(1);
});
