import { createLogger, format, transports } from "winston";
import LOGGER_CONFIG from "../configs/logger.config";

const { combine, timestamp, errors, json, colorize, printf } = format;

const isProd = process.env.NODE_ENV === "production";

/**
 * Dev format (pretty + readable)
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: LOGGER_CONFIG.timestampFormat }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    return `
    [${timestamp}] ${level}: ${message}
    ${stack ? stack : ""}
    ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}
    `;
  }),
);

/**
 * Prod format (structured JSON)
 */
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = createLogger({
  level: isProd ? "info" : "debug",
  format: isProd ? prodFormat : devFormat,
  defaultMeta: {
    service: LOGGER_CONFIG.serviceName,
    env: process.env.NODE_ENV,
  },
  transports: [
    // Always log to console (important for Docker/K8s)
    new transports.Console(),

    // File logs (optional but fine if you rotate them)
    new transports.File({
      dirname: LOGGER_CONFIG.logDirectory,
      filename: LOGGER_CONFIG.errorFile,
      level: "error",
      maxsize: LOGGER_CONFIG.maxFileSize,
      maxFiles: LOGGER_CONFIG.maxFiles,
      handleExceptions: true,
    }),

    new transports.File({
      dirname: LOGGER_CONFIG.logDirectory,
      filename: LOGGER_CONFIG.combinedFile,
      maxsize: LOGGER_CONFIG.maxFileSize,
      maxFiles: LOGGER_CONFIG.maxFiles,
    }),
  ],
  exitOnError: false,
});
