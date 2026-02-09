import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/loggers";
import { ZodError } from "zod";
import { AppError } from "../errors/app.error";
import { STATUS_CODES } from "../constants/statuscodes";
import { ERROR_MESSAGES } from "../constants/messages";

/**
 * Error handling middleware for Express applications.
 * It captures errors thrown in the application and formats them into consistent API responses.
 * - For Zod validation errors, it formats the issues into a structured response.
 * - For AppError instances, it uses the status code and message defined in the error.
 * - For all other errors, it returns a generic 500 Internal Server Error response.
 * @param err - The error object thrown in the application.
 */
export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    // Format Zod errors
    const formattedErrors = ValidationErrorHandler(err);

    logger.warn("Validation error", {
      requestId: req.requestId,
      errors: formattedErrors,
      path: req.originalUrl,
    });
    return res.status(STATUS_CODES.BAD_REQUEST).json(formattedErrors);
  }

  if (err instanceof AppError) {
    logger.error("Unhandled server error", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      //userId: req.user?.id,
      err, // stack trace included automatically
    });

    return res
      .status(err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json(createAppError(err));
  }

  logger.error("Unhandled server error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    //userId: req.user?.id,
    err, // stack trace included automatically
  });

  // For non-AppError and non-ZodError, return a generic message
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message,
  });
};

/**
 * ValidationErrorHandler formats Zod validation errors into a consistent structure for API responses.
 * @param err - The ZodError instance containing validation issues.
 * @returns The formatted error response object.
 */
const ValidationErrorHandler = (err: ZodError<any>) => {
  const formattedErrors = err.issues.map((e) => ({
    field: e.path.join(".") || "root",
    message: e.message,
  }));

  return {
    status: "fail",
    code: "VALIDATION_ERROR",
    message: ERROR_MESSAGES.VALIDATION_ERROR,
    errors: formattedErrors,
  };
};

/**
 * Helper function to create a consistent error response for AppError
 * @param err - The AppError instance to format.
 * @returns The formatted error response object.
 */
const createAppError = (err: AppError) => {
  const message =
    process.env.NODE_ENV === "production"
      ? ERROR_MESSAGES.SOMETHING_WENT_WRONG
      : err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  return {
    status: err.status || "error",
    code: "INTERNAL_SERVER_ERROR",
    message,
  };
};
