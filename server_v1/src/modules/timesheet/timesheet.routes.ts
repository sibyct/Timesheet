/**
 * @file modules/timesheet/timesheet.routes.ts
 * @description Express router for the /timesheets resource.
 *
 * Mount point (in routes/index.ts):
 *   rootRouter.use('/timesheets', timesheetRouter)
 *   → full paths: /api/v1/timesheets/*
 *
 * Route table:
 *   POST   /timesheets                  authenticated            — create draft
 *   GET    /timesheets                  authenticated            — list (scoped by role)
 *   GET    /timesheets/:id              authenticated            — get by id
 *   PATCH  /timesheets/:id              authenticated            — update draft/rejected
 *   DELETE /timesheets/:id              authenticated            — delete draft
 *   POST   /timesheets/:id/submit       authenticated            — draft → submitted
 *   POST   /timesheets/:id/recall       authenticated            — submitted → draft
 *   POST   /timesheets/bulk-approve     manager/admin (svc check) — bulk approve
 *   POST   /timesheets/:id/approve      manager/admin (svc check) — submitted → approved
 *   POST   /timesheets/:id/reject       manager/admin (svc check) — submitted → rejected
 */

import { Router, type IRouter } from "express";
import { authenticate } from "@middlewares/auth.middleware";
import { validate } from "@middlewares/validate.middleware";
import { catchAsync } from "@utils/catchAsync";
import * as ctrl from "./timesheet.controller";
import {
  createTimesheetSchema,
  updateTimesheetSchema,
  listTimesheetsQuerySchema,
  timesheetParamsSchema,
  rejectTimesheetSchema,
  bulkApproveSchema,
} from "./timesheet.validator";

export const timesheetRouter: IRouter = Router();

// All timesheet routes require authentication
timesheetRouter.use(authenticate);

// POST /timesheets — create a new draft timesheet
timesheetRouter.post(
  "/",
  validate({ body: createTimesheetSchema }),
  catchAsync(ctrl.create),
);

// GET /timesheets — list timesheets (scoped by role)
timesheetRouter.get(
  "/",
  validate({ query: listTimesheetsQuerySchema }),
  catchAsync(ctrl.list),
);

// GET /timesheets/:id — get a single timesheet
timesheetRouter.get(
  "/:id",
  validate({ params: timesheetParamsSchema }),
  catchAsync(ctrl.getById),
);

// PATCH /timesheets/:id — update notes and/or entries (editable statuses only)
timesheetRouter.patch(
  "/:id",
  validate({ params: timesheetParamsSchema, body: updateTimesheetSchema }),
  catchAsync(ctrl.update),
);

// DELETE /timesheets/:id — hard-delete a draft timesheet
timesheetRouter.delete(
  "/:id",
  validate({ params: timesheetParamsSchema }),
  catchAsync(ctrl.remove),
);

// POST /timesheets/:id/submit — draft → submitted
timesheetRouter.post(
  "/:id/submit",
  validate({ params: timesheetParamsSchema }),
  catchAsync(ctrl.submit),
);

// POST /timesheets/:id/recall — submitted → draft
timesheetRouter.post(
  "/:id/recall",
  validate({ params: timesheetParamsSchema }),
  catchAsync(ctrl.recall),
);

// POST /timesheets/bulk-approve — approve multiple submitted timesheets (manager/admin)
// NOTE: registered before /:id/* routes so 'bulk-approve' is not parsed as :id
timesheetRouter.post(
  "/bulk-approve",
  validate({ body: bulkApproveSchema }),
  catchAsync(ctrl.bulkApprove),
);

// POST /timesheets/:id/approve — submitted → approved (manager/admin)
timesheetRouter.post(
  "/:id/approve",
  validate({ params: timesheetParamsSchema }),
  catchAsync(ctrl.approve),
);

// POST /timesheets/:id/reject — submitted → rejected (manager/admin)
timesheetRouter.post(
  "/:id/reject",
  validate({ params: timesheetParamsSchema, body: rejectTimesheetSchema }),
  catchAsync(ctrl.reject),
);
