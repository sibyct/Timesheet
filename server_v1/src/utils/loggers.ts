import { createLogger, format, transports } from "winston";
const { combine, timestamp, colorize, errors, json } = format;
import LOGGER_CONFIG from "../configs/logger.config";
// Logger instance
export const logger = createLogger({
    level: "info", // default logging level
    format: combine(
        colorize(),
        timestamp({ format: LOGGER_CONFIG.timestampFormat }),
        errors({ stack: true }), // <-- log full stack trace
        json()
    ),
    transports: [
        new transports.Console(), // log to console
        new transports.File({
            dirname: LOGGER_CONFIG.logDirectory,
            filename: LOGGER_CONFIG.errorFile,
            level: "error",
            maxsize: LOGGER_CONFIG.maxFileSize,
            maxFiles: LOGGER_CONFIG.maxFiles,
            handleExceptions: true,
        }), // error logs
        new transports.File({
            dirname: LOGGER_CONFIG.logDirectory,
            filename: LOGGER_CONFIG.combinedFile,
            maxsize: LOGGER_CONFIG.maxFileSize,
            maxFiles: LOGGER_CONFIG.maxFiles,
            handleExceptions: true,

        })
    ],
    exitOnError: false, // do not exit on handled exceptions
});
