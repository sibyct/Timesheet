import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { tap, finalize } from 'rxjs/operators';
import { scopedLogger } from '@core/services/logger.service';
import { HTTP_CONFIG } from '@core/config/http/http.config';

// Singleton scoped logger — DI creates this once, not on every request.
const LOGGER = scopedLogger('LoggingInterceptor');

/**
 * Interceptor that logs each HTTP request's method, URL, status, and timing.
 * Slow-request warnings fire in all environments; debug traces are dev-only.
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LOGGER);
  const started = Date.now();
  const tag = `[HTTP] ${req.method} ${req.urlWithParams}`;

  return next(req).pipe(
    tap({
      next: (event) => {
        if (!(event instanceof HttpResponse)) return;

        const elapsed = Date.now() - started;

        if (isDevMode()) {
          logger.debug(`${tag} — ${event.status}`, {
            status: event.status,
            elapsed: `${elapsed}ms`,
          });
        }

        if (elapsed > HTTP_CONFIG.performance.slowThreshold) {
          logger.warn(`${tag} — SLOW REQUEST`, {
            elapsed: `${elapsed}ms`,
            threshold: `${HTTP_CONFIG.performance.slowThreshold}ms`,
          });
        }
      },
      error: (err) => {
        const elapsed = Date.now() - started;

        logger.error(`${tag} — ERROR`, {
          status: err?.status ?? 'unknown',
          message: err?.message ?? 'unknown',
          elapsed: `${elapsed}ms`,
        });
      },
    }),
    finalize(() => {
      if (isDevMode()) {
        const elapsed = Date.now() - started;
        logger.debug(`${tag} — COMPLETE`, { elapsed: `${elapsed}ms` });
      }
    }),
  );
};
