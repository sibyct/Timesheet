import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthActions } from '../store/auth/auth.actions';
import { UiActions } from '../store/ui/ui.actions';

/** Maps HTTP status codes to user-facing messages. */
function friendlyMessage(err: HttpErrorResponse): string {
  // Prefer the server's own message when it's a known operational error
  const serverMsg: string | undefined = err.error?.message;

  switch (err.status) {
    case 0:
      return 'No response from server. Check your connection.';
    case 400:
      return serverMsg ?? 'Bad request.';
    case 401:
      return serverMsg ?? 'Session expired. Please sign in again.';
    case 403:
      return serverMsg ?? 'You do not have permission to do that.';
    case 404:
      return serverMsg ?? 'The requested resource was not found.';
    case 409:
      return serverMsg ?? 'Conflict — this resource already exists.';
    case 422:
      return serverMsg ?? 'Validation failed. Check the form fields.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 503:
      return 'Service temporarily unavailable. Try again shortly.';
    default:
      return serverMsg ?? 'An unexpected error occurred.';
  }
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
