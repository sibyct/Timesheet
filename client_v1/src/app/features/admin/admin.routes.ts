import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'admin/dashboard',
    //canActivate: [adminGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'admin/users',
    //canActivate: [adminGuard],
    loadComponent: () =>
      import('./user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
  },
  {
    path: 'admin/timesheet',
    //canActivate: [adminGuard],
    loadComponent: () =>
      import('./timesheet/admin-timesheet.component').then(
        (m) => m.AdminTimesheetComponent,
      ),
  },
  {
    path: 'admin/approvals',
    //canActivate: [adminGuard],
    loadComponent: () =>
      import('./approval/approval.component').then((m) => m.ApprovalComponent),
  },
  {
    path: 'admin/projects',
    //canActivate: [adminGuard],
    loadComponent: () =>
      import('./projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: 'admin/reports',
    //canActivate: [adminGuard],
    loadComponent: () =>
      import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
];
