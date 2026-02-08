import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "@modules/auth/auth.service";
import { createError } from "@middleware/error.middleware";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@constants/messages";
import { STATUS_CODES } from "@constants/statuscodes";

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { employee_id, username, password } = req.body;
        const newUser = await registerUser(employee_id, username, password);
        res.status(STATUS_CODES.CREATED).json({ message: SUCCESS_MESSAGES.USER_CREATED, user: newUser });
    } catch (err: any) {
        next(err);
    }
};


export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;
        const result = await loginUser(username, password);

        if (!result) {
            return next(createError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED));
        };

        res.status(STATUS_CODES.OK).json({ message: SUCCESS_MESSAGES.LOGIN_SUCCESS, token: result.token });
    } catch (err: any) {
        next(err);
    }
};
