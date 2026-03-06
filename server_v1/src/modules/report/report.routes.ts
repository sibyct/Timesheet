/**
 * @file modules/report/report.routes.ts
 *
 * Mount point: /api/v1/reports
 *
 *   GET /reports/utilization         JSON — hours per user
 *   GET /reports/billing             JSON — billable revenue per project
 *   GET /reports/utilization/export  CSV  — utilization download
 *   GET /reports/billing/export      CSV  — billing download
 *
 * All routes require authentication + manager/admin role (enforced in service).
 */

import { Router, type IRouter } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validate.middleware';
import { catchAsync } from '@utils/catchAsync';
import * as ctrl from './report.controller';
import { reportQuerySchema } from './report.validator';

export const reportsRouter: IRouter = Router();

reportsRouter.use(authenticate);

const validateQuery = validate({ query: reportQuerySchema });

// Register /export sub-routes before the plain routes to avoid route shadowing
reportsRouter.get('/utilization/export', validateQuery, catchAsync(ctrl.exportUtilization));
reportsRouter.get('/billing/export',     validateQuery, catchAsync(ctrl.exportBilling));

reportsRouter.get('/utilization', validateQuery, catchAsync(ctrl.utilization));
reportsRouter.get('/billing',     validateQuery, catchAsync(ctrl.billing));
