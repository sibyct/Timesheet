import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { createError } from "./error.middleware";
import { STATUS_CODES } from "../constants/statuscodes";

export const validate =
    (schema: ZodType<any>) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                schema.parse(req.body);
                next();
            } catch (err: any) {
                const message = err.errors
                    ? err.errors
                        .map((e: any) => e.message).join(", ")
                    : "Invalid request data";

                next(createError(message, STATUS_CODES.BAD_REQUEST));
            }
        };
