import { inject, isDevMode } from '@angular/core';
import { HttpClient, HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { selectToken } from '@core/store/auth/auth.selectors';
import { AuthActions } from '@core/store/auth/auth.actions';
import { scopedLogger } from '@core/services/logger.service';
import { API } from '@core/constants/api-endpoints.constants';

// ─── Public routes — never attach a Bearer header ────────────────────────────
const PUBLIC_URLS: string[] = [API.AUTH.LOGIN, API.AUTH.REFRESH];

// ─── Concurrent-refresh guard ─────────────────────────────────────────────────
// Module-level so all interceptor calls share the same state.
// When a refresh is in-flight, subsequent 401s wait on pendingToken$
// instead of firing another refresh request.
let isRefreshing = false;
const pendingToken$ = new BehaviorSubject<string | null>(null);

const LOGGER = scopedLogger('AuthInterceptor');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

// ─── Interceptor ──────────────────────────────────────────────────────────────
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store  = inject(Store);
  const http   = inject(HttpClient);
  const logger = inject(LOGGER);

  // Skip public routes — no token needed, no 401 handling
  if (PUBLIC_URLS.some((url) => req.url.includes(url))) {
    return next(req);
  }

  return store.select(selectToken).pipe(
    take(1),
    switchMap((token) => {
      const authReq = token && !isExpired(token) ? withBearer(req, token) : req;

      if (isDevMode()) {
        logger.debug('Outgoing request', {
          url:     req.url,
          hasToken: !!token,
          expired:  token ? isExpired(token) : null,
        });
      }

      return next(authReq).pipe(
        catchError((err: unknown) => {
          if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
            return throwError(() => err);
          }

          // ── First 401: trigger a token refresh ───────────────────────────
          if (!isRefreshing) {
            isRefreshing = true;
            pendingToken$.next(null);

            return http
              .post<{ token: string }>(API.AUTH.REFRESH, {})
              .pipe(
                switchMap(({ token: newToken }) => {
                  isRefreshing = false;
                  pendingToken$.next(newToken);
                  store.dispatch(AuthActions.refreshTokenSuccess({ token: newToken }));
                  logger.info('Token refreshed — retrying original request');
                  return next(withBearer(req, newToken));
                }),
                catchError((refreshErr) => {
                  isRefreshing = false;
                  pendingToken$.next(null);
                  logger.warn('Token refresh failed — logging out');
                  store.dispatch(AuthActions.refreshTokenFailure());
                  return throwError(() => refreshErr);
                }),
              );
          }

          // ── Subsequent 401s: wait for the in-flight refresh ──────────────
          return pendingToken$.pipe(
            filter((token): token is string => token !== null),
            take(1),
            switchMap((newToken) => next(withBearer(req, newToken))),
          );
        }),
      );
    }),
  );
};
