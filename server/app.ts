import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import mongoose from "mongoose";
import pinoHttp from "pino-http";
import { config } from "./config/index";
import { logger } from "./middleware/logger";
import authRoutes from "./routes/auth.routes";
import timesheetRoutes from "./routes/timesheet.routes";
import adminRoutes from "./routes/admin.routes";
import { notFound, errorHandler } from "./middleware/error.middleware";

const app = express();

if (!config.mongoUri || !config.jwtSecret || !config.port) {
  logger.error(
    "Missing required environment variables. Please check your .env file.",
  );
  process.exit(1);
}

// Connect to MongoDB
(async () => {
  try {
    await mongoose.connect(config.mongoUri!);
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error({ err }, "MongoDB connection error");
  }
})();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve Angular frontend build
app.use(
  express.static(
    path.join(__dirname, "../client-angular/dist/client-angular/browser"),
  ),
);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API Routes
app.use("/user", authRoutes);
app.use("/time", timesheetRoutes);
app.use("/admin", adminRoutes);

// Catch-all: serve Angular app for all non-API routes (SPA routing)
app.get("*", (req, res, next) => {
  if (
    req.path.startsWith("/user") ||
    req.path.startsWith("/time") ||
    req.path.startsWith("/admin")
  ) {
    return next();
  }
  res.sendFile(
    path.join(
      __dirname,
      "../client-angular/dist/client-angular/browser/index.html",
    ),
  );
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
