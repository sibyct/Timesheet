import { Routes } from '@angular/router';
import { ROUTES } from '@core/constants/routes-path.constants';
export const adminRoutes: Routes = [
  {
    path: ROUTES.ADMIN_DASHBOARD,
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: ROUTES.ADMIN_USERS,
    loadComponent: () =>
      import('./user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
  },
  {
    path: ROUTES.ADMIN_TIMESHEET,
    loadComponent: () =>
      import('./timesheet/admin-timesheet.component').then(
        (m) => m.AdminTimesheetComponent,
      ),
  },
  {
    path: ROUTES.ADMIN_APPROVALS,
    loadComponent: () =>
      import('./approval/approval.component').then((m) => m.ApprovalComponent),
  },
  {
    path: ROUTES.ADMIN_PROJECTS,
    loadComponent: () =>
      import('./projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: ROUTES.ADMIN_REPORTS,
    loadComponent: () =>
      import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
];
