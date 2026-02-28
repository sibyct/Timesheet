import { generateToken } from "../middleware/auth.middleware";
import User from "../models/user.model";
import { AppError } from "../utils/app-error";
export interface LoginResult {
  token: string;
  role: number;
}

export const AuthService = {
  async login(userName: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ username: userName });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    const { userId, username, role, firstName } = user;
    const token = generateToken({
      userId,
      username,
      role,
      firstName,
    });

    return { token, role: user.role };
  },

  async changePassword(username: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(
        "User not found. Cannot change password for non-existent user.",
        404,
      );
    }
    user.password = newPassword;
    await user.save();
  },
};
