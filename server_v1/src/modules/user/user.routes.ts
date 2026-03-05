/**
 * @file modules/user/user.routes.ts
 * @description Express router for the /users resource.
 *
 * Mount point (in routes/index.ts):
 *   app.use('/api/v1/users', usersRouter)
 *
 * Route table:
 *   GET    /users                        admin
 *   POST   /users                        admin
 *   GET    /users/me                     any authenticated user
 *   PATCH  /users/me                     any authenticated user
 *   POST   /users/me/change-password     any authenticated user
 *   GET    /users/:id                    admin OR owner
 *   PATCH  /users/:id                    admin only
 *   DELETE /users/:id                    admin only
 *
 * Middleware order per route:
 *   authenticate → authorize/authorizeOwnerOrAdmin → validate → catchAsync(controller)
 *
 * NOTE: /me routes MUST be registered before /:id so Express doesn't
 *       treat the literal string "me" as a MongoDB ObjectId.
 */

import { Router, type IRouter } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize, authorizeOwnerOrAdmin } from '@middlewares/authorize.middleware';
import { validate, mongoIdParam } from '@middlewares/validate.middleware';
import { catchAsync } from '@utils/catchAsync';
import * as ctrl from './user.controller';
import {
  createUserSchema,
  updateUserSchema,
  updateMeSchema,
  changePasswordSchema,
  listUsersQuerySchema,
} from './user.validator';

export const usersRouter: IRouter = Router();

// ── Collection routes ─────────────────────────────────────────────────────────

usersRouter
  .route('/')
  .get(
    authenticate,
    authorize('admin'),
    validate({ query: listUsersQuerySchema }),
    catchAsync(ctrl.list),
  )
  .post(
    authenticate,
    authorize('admin'),
    validate({ body: createUserSchema }),
    catchAsync(ctrl.create),
  );

// ── /me routes (must come before /:id) ───────────────────────────────────────

usersRouter.get(
  '/me',
  authenticate,
  catchAsync(ctrl.getMe),
);

usersRouter.patch(
  '/me',
  authenticate,
  validate({ body: updateMeSchema }),
  catchAsync(ctrl.updateMe),
);

usersRouter.post(
  '/me/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  catchAsync(ctrl.changePassword),
);

// ── Single-resource routes (/users/:id) ───────────────────────────────────────

usersRouter.get(
  '/:id',
  authenticate,
  authorizeOwnerOrAdmin((req) => req.params['id'] ?? ''),
  validate({ params: mongoIdParam }),
  catchAsync(ctrl.getOne),
);

usersRouter.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: mongoIdParam, body: updateUserSchema }),
  catchAsync(ctrl.update),
);

usersRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: mongoIdParam }),
  catchAsync(ctrl.remove),
);
