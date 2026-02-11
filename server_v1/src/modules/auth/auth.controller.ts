import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "./auth.service";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../constants/messages";
import { STATUS_CODES } from "../../constants/statuscodes";
import { AppError } from "../../errors/app.error";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
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

/**
 * @desc    Login user and return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { emailAddress, password } = req.body;
    const result = await loginUser(emailAddress, password);

    res
      .status(STATUS_CODES.OK)
      .json({ user: result.user, token: result.token });
  } catch (err: any) {
    next(err);
  }
};
