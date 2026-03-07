import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { ROUTES } from '@core/constants/routes-path.constants';
export const routes: Routes = [
  { path: '', redirectTo: ROUTES.TIMESHEET, pathMatch: 'full' },
  {
    path: ROUTES.LOGIN,
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
        path: ROUTES.TIMESHEET,
        loadComponent: () =>
          import('./features/timesheet/timesheet.component').then(
            (m) => m.TimesheetComponent,
          ),
      },
      {
        path: ROUTES.PROFILE,
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: ROUTES.ADMIN,
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'timesheet' },
];
