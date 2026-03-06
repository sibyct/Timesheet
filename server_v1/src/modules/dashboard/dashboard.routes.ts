/**
 * @file modules/dashboard/dashboard.routes.ts
 * Mount point: /api/v1/dashboard
 *
 *   GET /dashboard   → aggregated KPI stats (manager/admin only)
 */

import { Router, type IRouter } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { catchAsync } from '@utils/catchAsync';
import { getDashboard } from './dashboard.controller';

export const dashboardRouter: IRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get('/', catchAsync(getDashboard));
