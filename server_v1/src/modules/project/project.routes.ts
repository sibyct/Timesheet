/**
 * @file modules/project/project.routes.ts
 *
 * Mount point: /api/v1/projects
 *
 *   GET    /projects                  authenticated — list (scoped by role)
 *   POST   /projects                  manager/admin — create
 *   GET    /projects/:id              authenticated — get by id
 *   PATCH  /projects/:id              manager/admin — update
 *   DELETE /projects/:id              admin only    — delete
 *   POST   /projects/:id/members      manager/admin — add member
 *   DELETE /projects/:id/members      manager/admin — remove member
 */

import { Router, type IRouter } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validate.middleware';
import { catchAsync } from '@utils/catchAsync';
import * as ctrl from './project.controller';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
  projectParamsSchema,
  memberBodySchema,
} from './project.validator';

export const projectsRouter: IRouter = Router();

// All routes require authentication
projectsRouter.use(authenticate);

// ── Collection ───────────────────────────────────────────────────────────────

projectsRouter.get(
  '/',
  validate({ query: listProjectsQuerySchema }),
  catchAsync(ctrl.list),
);

projectsRouter.post(
  '/',
  validate({ body: createProjectSchema }),
  catchAsync(ctrl.create),
);

// ── Resource ─────────────────────────────────────────────────────────────────

projectsRouter.get(
  '/:id',
  validate({ params: projectParamsSchema }),
  catchAsync(ctrl.getById),
);

projectsRouter.patch(
  '/:id',
  validate({ params: projectParamsSchema, body: updateProjectSchema }),
  catchAsync(ctrl.update),
);

projectsRouter.delete(
  '/:id',
  validate({ params: projectParamsSchema }),
  catchAsync(ctrl.remove),
);

// ── Members ──────────────────────────────────────────────────────────────────

projectsRouter.post(
  '/:id/members',
  validate({ params: projectParamsSchema, body: memberBodySchema }),
  catchAsync(ctrl.addMember),
);

projectsRouter.delete(
  '/:id/members',
  validate({ params: projectParamsSchema, body: memberBodySchema }),
  catchAsync(ctrl.removeMember),
);
