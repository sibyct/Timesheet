import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthActions } from '../store/auth/auth.actions';
import { UiActions } from '../store/ui/ui.actions';
import { HTTP_ERRORS } from '../constants/http-error.constants';
/** Maps HTTP status codes to user-facing messages. */
function friendlyMessage(err: HttpErrorResponse): string {
  // Prefer the server's own message when it's a known operational error
  const serverMsg: string | undefined = err.error?.message;
  const errStatus = err.status as keyof typeof HTTP_ERRORS;
  if (HTTP_ERRORS[errStatus]) {
    return serverMsg ?? HTTP_ERRORS[errStatus];
  }
  return serverMsg ?? 'An unexpected error occurred.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      // 401 — token expired or invalid; force logout
      if (err.status === 401) {
        store.dispatch(AuthActions.logout());
        // Do NOT show a notification here — the login page handles it
        return throwError(() => err);
      }

      // All other HTTP errors → show a notification
      const message = friendlyMessage(err);
      store.dispatch(UiActions.showNotification({ message, kind: 'error' }));

      return throwError(() => err);
    }),
  );
};
