import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { createError } from "./error.middleware";
import { STATUS_CODES } from "../constants/statuscodes";

export const validate =
  (schema: ZodType<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (validationError: ZodError | unknown) {
      console.error("Validation error:", validationError);
      if (validationError instanceof ZodError) {
        // Format Zod errors
        const zodErr = validationError as ZodError<any>; // <--- cast to any
        const formattedErrors = zodErr.issues.map((e) => ({
          field: e.path.join(".") || "root", // Which field failed
          message: e.message, // Error message
        }));

        return next(
          createError(
            JSON.stringify(formattedErrors),
            STATUS_CODES.BAD_REQUEST,
          ),
        );
      } else {
        // For non-Zod errors, return a generic message
        const message =
          validationError instanceof Error
            ? validationError.message
            : "Invalid request data";
        return next(createError(message, STATUS_CODES.BAD_REQUEST));
      }
    }
  };
