/**
 * @file redis.ts
 * @description ioredis client singleton with reconnect strategy and helpers.
 *
 * Features:
 * - Single shared client (reused across the app)
 * - Exponential back-off reconnect (capped at 30 s)
 * - Graceful disconnect called by server.ts on shutdown
 * - Type-safe cache helpers: get, set, del, flush
 * - Separate Redis client for Bull/BullMQ queues (if added later)
 */

import Redis, { type RedisOptions } from "ioredis";
import { env } from "./env";
import { createLogger } from "./logger";

const log = createLogger("redis");

// ─── Connection Options ───────────────────────────────────────────────────────

const REDIS_OPTIONS: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  password: env.REDIS_PASSWORD || undefined,

  // Exponential back-off: 2^attempt * 100ms, capped at 30 s, max 20 retries
  retryStrategy: (times: number): number | null => {
    if (times > 20) {
      log.error("Redis: max reconnect attempts reached — giving up");
      return null; // stop retrying
    }
    const delay = Math.min(Math.pow(2, times) * 100, 30_000);
    log.warn({ attempt: times, nextRetryMs: delay }, "Redis reconnecting…");
    return delay;
  },

  // Reconnect on command errors (network blips mid-pipeline)
  reconnectOnError: (err: Error): boolean => {
    const targetErrors = ["READONLY", "ETIMEDOUT", "ECONNRESET"];
    return targetErrors.some((msg) => err.message.includes(msg));
  },

  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: false, // Connect immediately so startup errors surface early
};

// ─── Client Singleton ─────────────────────────────────────────────────────────

let _client: Redis | null = null;

/**
 * Returns the shared ioredis client, creating it on first call.
 */
export function getRedisClient(): Redis {
  if (_client) return _client;

  _client = new Redis(REDIS_OPTIONS);

  _client.on("connect", () => {
    log.info(
      { host: env.REDIS_HOST, port: env.REDIS_PORT, db: env.REDIS_DB },
      "Redis connected",
    );
  });

  _client.on("ready", () => {
    log.info("Redis ready");
  });

  _client.on("error", (err: Error) => {
    log.error({ err }, "Redis error");
  });

  _client.on("close", () => {
    log.info("Redis connection closed");
  });

  _client.on("reconnecting", () => {
    log.warn("Redis reconnecting…");
  });

  return _client;
}

/**
 * Gracefully disconnects the Redis client.
 * Called during SIGTERM/SIGINT handling in server.ts.
 */
export async function disconnectRedis(): Promise<void> {
  if (!_client) return;
  log.info("Closing Redis connection…");
  await _client.quit();
  _client = null;
  log.info("Redis connection closed gracefully");
}

// ─── Cache Helpers ────────────────────────────────────────────────────────────

/**
 * Retrieves a cached value and deserialises it from JSON.
 * Returns `null` on cache miss or parse error.
 *
 * @param key - Cache key
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const raw = await client.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    log.warn({ key }, "Redis: failed to parse cached value — evicting");
    await client.del(key);
    return null;
  }
}

/**
 * Serialises a value to JSON and stores it with an optional TTL.
 *
 * @param key   - Cache key
 * @param value - Value to cache
 * @param ttl   - TTL in seconds (defaults to REDIS_TTL_SECONDS from env)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = env.REDIS_TTL_SECONDS,
): Promise<void> {
  const client = getRedisClient();
  await client.set(key, JSON.stringify(value), "EX", ttl);
}

/**
 * Deletes one or more cache keys.
 *
 * @param keys - One or more cache keys to delete
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const client = getRedisClient();
  await client.del(...keys);
}

/**
 * Deletes all keys matching a glob pattern.
 * Use sparingly in production — SCAN is used (not KEYS) to avoid blocking.
 *
 * @param pattern - Glob pattern e.g. `users:*`
 */
export async function cacheFlushPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  let cursor = "0";
  let total = 0;

  do {
    const [nextCursor, keys] = await client.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;

    if (keys.length > 0) {
      await client.del(...keys);
      total += keys.length;
    }
  } while (cursor !== "0");

  return total;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Pings Redis and returns true if the connection is healthy.
 * Used in the /health endpoint.
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const result = await getRedisClient().ping();
    return result === "PONG";
  } catch {
    return false;
  }
}
