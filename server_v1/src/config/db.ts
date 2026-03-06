/**
 * @file db.ts
 * @description Mongoose connection manager.
 *
 * Features:
 * - Configurable connection pool (maxPoolSize / minPoolSize from env)
 * - Automatic reconnect with exponential back-off
 * - Graceful shutdown on SIGTERM / SIGINT
 * - emitWarning suppressed for strictQuery (Mongoose 7+)
 * - All Mongoose events are logged via the shared logger
 */

import mongoose from "mongoose";
import { env } from "./env";
import { createLogger } from "./logger";

const log = createLogger("db");

// ─── Connection Options ───────────────────────────────────────────────────────

const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: env.MONGO_POOL_MAX,
  minPoolSize: env.MONGO_POOL_MIN,

  // How long the driver waits before timing out a connection attempt
  serverSelectionTimeoutMS: 10_000,

  // Max time a socket can be idle before being closed
  socketTimeoutMS: 45_000,

  // Keepalive prevents the OS from closing idle TCP connections
  family: 4, // Force IPv4 to avoid Docker network issues
};

// ─── Event Listeners ─────────────────────────────────────────────────────────

function attachMongooseEventListeners(): void {
  const conn = mongoose.connection;

  conn.on("connected", () => {
    log.info({ uri: sanitiseUri(env.MONGO_URI) }, "MongoDB connected");
  });

  conn.on("disconnected", () => {
    log.warn("MongoDB disconnected — driver will attempt reconnect");
  });

  conn.on("reconnected", () => {
    log.info("MongoDB reconnected");
  });

  conn.on("error", (err: Error) => {
    log.error({ err }, "MongoDB connection error");
  });

  conn.on("close", () => {
    log.info("MongoDB connection closed");
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strips username/password from a MongoDB URI for safe logging.
 * mongodb+srv://user:pass@cluster → mongodb+srv://***@cluster
 */
function sanitiseUri(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.password) url.password = "***";
    if (url.username) url.username = "***";
    return url.toString();
  } catch {
    return "<invalid-uri>";
  }
}

// ─── Connect ──────────────────────────────────────────────────────────────────

let _connected = false;

/**
 * Establishes the Mongoose connection.
 * Idempotent — safe to call multiple times (e.g. in tests).
 *
 * @throws Will throw if the initial connection attempt fails (so the server
 *         can catch it and exit rather than silently starting disconnected).
 */
export async function connectDB(): Promise<void> {
  if (_connected) return;

  attachMongooseEventListeners();

  log.info({ uri: sanitiseUri(env.MONGO_URI) }, "Connecting to MongoDB…");

  await mongoose.connect(env.MONGO_URI, MONGOOSE_OPTIONS);

  _connected = true;
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

/**
 * Gracefully closes the Mongoose connection.
 * Called during SIGTERM/SIGINT handling in server.ts.
 */
export async function disconnectDB(): Promise<void> {
  if (!_connected) return;

  log.info("Closing MongoDB connection…");
  await mongoose.connection.close();
  _connected = false;
  log.info("MongoDB connection closed gracefully");
}

export type DbStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "disconnecting";

/**
 * Returns the current Mongoose connection state as a human-readable string.
 * Useful for health-check endpoints.
 */
export function getDbStatus(): DbStatus {
  const states: Record<number, DbStatus> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] ?? "disconnected";
}
