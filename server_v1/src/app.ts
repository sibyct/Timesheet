import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { logger } from "./utils/loggers";

// Load environment variables from .env file
function initializeRoutes(app: express.Application) {
  app.use("/api/auth", authRoutes);
}

function initializeMiddleware(app: express.Application) {
  // Add request ID middleware
  app.use(requestIdMiddleware);

  // Parse JSON bodies with a size limit of 1mb
  app.use(express.json({ limit: "1mb" }));

  app.use(helmet());

  app.use(cors());

  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.info(message),
      },
    }),
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      //TODO: make this configurable
      max: process.env.NODE_ENV === "production" ? 100 : 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  initializeRoutes(app);

  // Error handling middleware
  app.use(errorMiddleware);
}

export async function initializeApp() {
  dotenv.config();

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  const app = express();
  initializeMiddleware(app);
  return app;
}
