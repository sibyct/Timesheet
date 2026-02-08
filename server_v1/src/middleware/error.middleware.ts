import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/loggers";
import { ZodError } from "zod";
import { AppError } from "../errors/app.error";

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err);
  if (err instanceof ZodError) {
    // Format Zod errors
    const formattedErrors = ValidationErrorHandler(err);
    return res.status(400).json(formattedErrors);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode || 500).json(createAppError(err));
  }

  // For non-AppError and non-ZodError, return a generic message
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return res.status(500).json({
    status: "error",
    message,
  });
};

const ValidationErrorHandler = (err: ZodError<any>) => {
  const formattedErrors = err.issues.map((e) => ({
    field: e.path.join(".") || "root",
    message: e.message,
  }));

  return {
    status: "fail",
    message: "Validation error",
    errors: formattedErrors,
  };
};

const createAppError = (err: AppError) => {
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong!"
      : err.message || "Internal Server Error";

  return {
    status: err.status || "error",
    message,
  };
};
