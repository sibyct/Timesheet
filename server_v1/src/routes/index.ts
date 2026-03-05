/**
 * @file routes/index.ts
 * @description Root API router — mounts all feature routers under /api/v1.
 *
 * Each feature router is registered here as it is built.
 * Currently stubs are registered so the server starts cleanly on day 1.
 * Uncomment each import as the corresponding module is implemented.
 */

import { Router, type IRouter, type Request, type Response } from 'express';

// ─── Feature routers (uncomment as implemented) ───────────────────────────────
import { authRouter }      from '@modules/auth/auth.routes';
import { usersRouter }     from '@modules/user/user.routes';
// import { timesheetRouter } from '@modules/timesheet/timesheet.routes';
// import { approvalRouter }  from '@modules/approval/approval.routes';
// import { projectsRouter }  from '@modules/project/project.routes';
// import { reportsRouter }   from '@modules/reports/reports.routes';

export const rootRouter: IRouter = Router();

// ── Ping (quick sanity check, no auth) ───────────────────────────────────────
rootRouter.get('/ping', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

// ── Feature mounts ────────────────────────────────────────────────────────────
rootRouter.use('/auth',      authRouter);
rootRouter.use('/users',     usersRouter);
// rootRouter.use('/timesheets', timesheetRouter);
// rootRouter.use('/approvals', approvalRouter);
// rootRouter.use('/projects',  projectsRouter);
// rootRouter.use('/reports',   reportsRouter);
