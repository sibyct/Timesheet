import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
  },
  {
    path: 'timesheet',
    loadComponent: () =>
      import('./timesheet/admin-timesheet.component').then(
        (m) => m.AdminTimesheetComponent,
      ),
  },
  {
    path: 'approvals',
    loadComponent: () =>
      import('./approval/approval.component').then((m) => m.ApprovalComponent),
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
];
