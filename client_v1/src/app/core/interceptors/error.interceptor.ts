import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UiActions } from '@core/store/ui/ui.actions';
import { LoggerService } from '@core/services/logger.service';
import { HTTP_ERRORS } from '@core/constants/http-error.constants';

function friendlyMessage(err: HttpErrorResponse): string {
  const serverMsg = err.error?.message as string | undefined;
  const mapped = HTTP_ERRORS[err.status as keyof typeof HTTP_ERRORS];
  return serverMsg ?? mapped ?? 'An unexpected error occurred.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const logger = inject(LoggerService).withContext('ErrorInterceptor');

  return next(req).pipe(
    catchError((err: unknown) => {
      // ✅ Non-HTTP errors — rethrow for GlobalErrorHandler
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      // ✅ Log every HTTP error
      logger.error('HTTP Error', {
        status: err.status,
        url: req.url,
        message: err.message,
      });

      // ✅ Network error — status 0
      if (err.status === 0) {
        store.dispatch(
          UiActions.showNotification({
            message: 'Network error — please check your connection',
            kind: 'error',
          }),
        );
        return throwError(() => err);
      }

      // ✅ 401 — owned by authInterceptor, just rethrow
      if (err.status === 401) {
        return throwError(() => err);
      }

      // ✅ 403 — access denied
      if (err.status === 403) {
        store.dispatch(
          UiActions.showNotification({
            message: 'You do not have permission to perform this action.',
            kind: 'error',
          }),
        );
        return throwError(() => err);
      }

      // ✅ All other errors — show friendly notification
      const message = friendlyMessage(err);
      store.dispatch(UiActions.showNotification({ message, kind: 'error' }));

      return throwError(() => err);
    }),
  );
};
