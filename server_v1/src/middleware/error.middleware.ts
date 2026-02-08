import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/loggers";

export interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}

// Utility function to create clean operational errors
export const createError = (message: string, statusCode = 500): AppError => {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};

export const errorMiddleware = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    logger.error("Error:", err);

    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === "production"
            ? "Something went wrong!"
            : err.message || "Internal Server Error";

    res.status(statusCode).json({
        status: "error",
        message,
    });
};
