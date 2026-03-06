/**
 * @file app.ts
 * @description Express application factory with the complete middleware stack.
 *
 * Middleware order (as specified in the architecture):
 *   helmet → cors → express-mongo-sanitize → hpp → rateLimiter →
 *   requestLogger → routes
 *
 * Auth (authenticate) and authorize are applied per-route inside the router,
 * not globally here, so public routes (/health, /auth/login, /api-docs)
 * remain accessible.
 */

import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import compression from "compression";
import pinoHttp from "pino-http";
import type { IncomingMessage } from "http";

import { env, corsOrigins, isDev } from "@config/env";
import { logger } from "@config/logger";
import { getDbStatus } from "@config/db";
import { isRedisHealthy } from "@config/redis";
import { mountSwagger } from "@config/swagger";
import { rootRouter } from "@routes/index";
import { globalLimiter, notFound, errorHandler } from "@middlewares/index";
import { catchAsync } from "@utils/catchAsync";

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Creates and configures the Express application.
 * Separated from server.ts so the app can be imported in tests
 * without binding to a port.
 */
export function createApp(): Application {
  const app = express();

  // ── 1. Trust proxy (needed behind nginx / ECS / k8s ingress) ──────────────
  app.set("trust proxy", 1);

  // ── 2. Helmet — security headers ──────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: isDev ? false : undefined,
      crossOriginEmbedderPolicy: false, // Swagger UI iframes need this off
    }),
  );

  // ── 3. CORS ───────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server calls (no origin) in non-prod
        if (
          !origin ||
          corsOrigins.includes(origin) ||
          corsOrigins.includes("*")
        ) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
      },
      credentials: true, // Required for httpOnly refresh token cookie
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["X-Total-Count"],
    }),
  );

  // ── 4. Body parsers ───────────────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // ── 5. Compression ────────────────────────────────────────────────────────
  app.use(compression());

  // ── 6. NoSQL Injection prevention ─────────────────────────────────────────
  app.use(
    mongoSanitize({
      onSanitize: ({ req, key }) => {
        logger.warn(
          { path: req.path, key },
          "Sanitized NoSQL injection attempt",
        );
      },
    }),
  );

  // ── 7. HTTP Parameter Pollution ───────────────────────────────────────────
  app.use(hpp());

  // ── 8. Global rate limiter ────────────────────────────────────────────────
  app.use(globalLimiter);

  // ── 9. Request logger (pino-http) ─────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      // Skip health check spam in logs
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
      customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      serializers: {
        req(req: IncomingMessage & { id?: unknown }) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            //headers: req.headers,
          };
        },
      },
    }),
  );

  // ── 10. Swagger UI (only accessible in non-production by default) ──────────
  if (!env.NODE_ENV.startsWith("production")) {
    mountSwagger(app);
  }

  // ── 11. Health check — publicly accessible, no auth ───────────────────────
  app.get(
    "/health",
    catchAsync(async (_req: Request, res: Response) => {
      const redisOk = await isRedisHealthy();

      const status = {
        status: "ok",
        env: env.NODE_ENV,
        uptime: process.uptime(),
        db: getDbStatus(),
        redis: redisOk ? "ok" : "error",
        version: process.env["npm_package_version"] ?? "1.0.0",
      };

      const httpStatus = status.db === "connected" && redisOk ? 200 : 503;

      res.status(httpStatus).json(status);
    }),
  );

  // ── 12. API routes ────────────────────────────────────────────────────────
  app.use(`${env.API_PREFIX}/${env.API_VERSION}`, rootRouter);

  // ── 13. 404 handler — must come after all routes ──────────────────────────
  app.use(notFound);

  // ── 14. Global error handler — must be the last middleware ────────────────
  app.use(errorHandler);

  return app;
}
