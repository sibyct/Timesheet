import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/shell/shell.component').then(
        (m) => m.ShellComponent,
      ),
    children: [
      {
        path: 'timesheet',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/timesheet/timesheet.component').then(
            (m) => m.TimesheetComponent,
          ),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/user-management/user-management.component').then(
                (m) => m.UserManagementComponent,
              ),
          },
          {
            path: 'timesheet',
            loadComponent: () =>
              import('./features/admin/timesheet/admin-timesheet.component').then(
                (m) => m.AdminTimesheetComponent,
              ),
          },
          { path: '', redirectTo: 'users', pathMatch: 'full' },
        ],
      },
      { path: '', redirectTo: 'timesheet', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
