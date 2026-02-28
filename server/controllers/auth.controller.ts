import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../types/index";

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const { token, role } = await AuthService.login(username, password);

      res.status(200).json({ token, role, status: "Login successful!" });
    } catch (err) {
      next(err);
    }
  },

  logout(_req: Request, res: Response): void {
    res.status(200).json({ status: "Bye!" });
  },

  isAuthenticated(req: AuthRequest, res: Response): void {
    res.status(200).json({ authenticate: true, userData: req.user });
  },

  async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { password } = req.body;
      await AuthService.changePassword(req.user!.username, password);
      res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
      next(err);
    }
  },
};
