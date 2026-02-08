import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "./auth.service";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../constants/messages";
import { STATUS_CODES } from "../../constants/statuscodes";
import { AppError } from "../../errors/app.error";
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { emailAddress, password, firstName, lastName } = req.body;
    await registerUser(emailAddress, password, firstName, lastName);
    res
      .status(STATUS_CODES.CREATED)
      .json({ message: SUCCESS_MESSAGES.USER_CREATED });
  } catch (err: any) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);

    if (!result) {
      return next(
        new AppError(
          ERROR_MESSAGES.INVALID_CREDENTIALS,
          STATUS_CODES.UNAUTHORIZED,
        ),
      );
    }

    res
      .status(STATUS_CODES.OK)
      .json({ message: SUCCESS_MESSAGES.LOGIN_SUCCESS, token: result.token });
  } catch (err: any) {
    next(err);
  }
};
