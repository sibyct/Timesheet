import { generateToken } from '../middleware/auth.middleware';
import User from '../models/user.model';

export interface LoginResult {
  token: string;
  role: number;
}

export const AuthService = {
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ username });
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const token = generateToken({
      userId: user.userId,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
    });

    return { token, role: user.role };
  },

  async changePassword(username: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ username });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    user.password = newPassword;
    await user.save();
  },
};
