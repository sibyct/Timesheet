import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'timesheet', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/shell.component').then(
        (m) => m.ShellComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'timesheet',
        loadComponent: () =>
          import('./features/timesheet/timesheet.component').then(
            (m) => m.TimesheetComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
      // {
      //   path: 'admin/dashboard',
      //   canActivate: [adminGuard],
      //   loadComponent: () =>
      //     import('./features/admin/dashboard/dashboard.component').then(
      //       (m) => m.DashboardComponent,
      //     ),
      // },
      // {
      //   path: 'admin/users',
      //   canActivate: [adminGuard],
      //   loadComponent: () =>
      //     import('./features/admin/user-management/user-management.component').then(
      //       (m) => m.UserManagementComponent,
      //     ),
      // },
      // {
      //   path: 'admin/timesheet',
      //   canActivate: [adminGuard],
      //   loadComponent: () =>
      //     import('./features/admin/timesheet/admin-timesheet.component').then(
      //       (m) => m.AdminTimesheetComponent,
      //     ),
      // },
      // {
      //   path: 'admin/approvals',
      //   canActivate: [adminGuard],
      //   loadComponent: () =>
      //     import('./features/admin/approval/approval.component').then(
      //       (m) => m.ApprovalComponent,
      //     ),
      // },
      // {
      //   path: 'admin/projects',
      //   canActivate: [adminGuard],
      //   loadComponent: () =>
      //     import('./features/admin/projects/projects.component').then(
      //       (m) => m.ProjectsComponent,
      //     ),
      // },
      // {
      //   path: 'admin/reports',
      //   canActivate: [adminGuard],
      //   loadComponent: () =>
      //     import('./features/admin/reports/reports.component').then(
      //       (m) => m.ReportsComponent,
      //     ),
      // },
    ],
  },
  { path: '**', redirectTo: 'timesheet' },
];
