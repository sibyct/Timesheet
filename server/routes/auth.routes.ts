import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware';
import { validate, loginSchema, changePasswordSchema } from '../middleware/validate.middleware';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { status: 'Too many login attempts, please try again later.' },
});

router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.get('/logout', AuthController.logout);
router.get('/isAuthenticated', authenticate, AuthController.isAuthenticated);
router.post('/changePassword', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;
