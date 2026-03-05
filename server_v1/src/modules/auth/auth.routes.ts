/**
 * @file modules/auth/auth.routes.ts
 * @description Express router for the /auth resource.
 *
 * Mount point (in routes/index.ts):
 *   rootRouter.use('/auth', authRouter)
 *   → full paths: /api/v1/auth/*
 *
 * Route table:
 *   POST /auth/login          public        — authLimiter + validate
 *   POST /auth/logout         authenticated — clears refresh cookie
 *   POST /auth/refresh-token  cookie-based  — authLimiter, no Bearer required
 *
 * Note: the refresh-token cookie path is set to "/api/v1/auth/refresh-token"
 * so the browser only sends it to this one endpoint — never to other routes.
 */

import { Router, type IRouter } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validate.middleware';
import { authLimiter } from '@middlewares/rateLimiter.middleware';
import { catchAsync } from '@utils/catchAsync';
import * as ctrl from './auth.controller';
import { loginSchema } from './auth.validator';

export const authRouter: IRouter = Router();

// POST /auth/login
authRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  catchAsync(ctrl.login),
);

// POST /auth/logout  (requires valid access token)
authRouter.post(
  '/logout',
  authenticate,
  catchAsync(ctrl.logout),
);

// POST /auth/refresh-token  (reads httpOnly cookie — no Bearer token needed)
authRouter.post(
  '/refresh-token',
  authLimiter,
  catchAsync(ctrl.refresh),
);
