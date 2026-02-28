import { Router, Request, Response } from 'express';
import { authenticate, generateToken } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/index';
import User from '../models/user.model';

const router = Router();

// POST /user/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ status: 'Username and password are required' });
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ status: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ status: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: user.userId,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
    });

    res.status(200).json({ token, role: user.role, status: 'Login successful!' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

// GET /user/logout  (JWT is stateless — client just discards the token)
router.get('/logout', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'Bye!' });
});

// GET /user/isAuthenticated
router.get('/isAuthenticated', authenticate, (req: AuthRequest, res: Response): void => {
  res.status(200).json({ authenticate: true, userData: req.user });
});

// POST /user/changePassword
router.post('/changePassword', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ status: 'Password is required' });
    return;
  }

  try {
    const user = await User.findOne({ username: req.user!.username });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.password = password;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ status: 'Server error', error: err });
  }
});

export default router;
