import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AuthActions } from './auth.actions';

const TOKEN_KEY = 'timesheet_token';

export const loginEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ username, password }) =>
        authService.login(username, password).pipe(
          map(({ accessToken, user }) =>
            AuthActions.loginSuccess({ token: accessToken, user }),
          ),
          catchError((err) =>
            of(
              AuthActions.loginFailure({
                error: err?.error?.message ?? 'Invalid username or password.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loginSuccessEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ token, user }) => {
        localStorage.setItem(TOKEN_KEY, token);
        const destination =
          user.role === 'admin'
            ? '/admin/dashboard'
            : user.role === 'manager'
              ? '/admin/approvals'
              : '/timesheet';
        router.navigate([destination]);
      }),
    ),
  { functional: true, dispatch: false },
);

export const logoutEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        localStorage.removeItem(TOKEN_KEY);
        router.navigate(['/login']);
      }),
    ),
  { functional: true, dispatch: false },
);
