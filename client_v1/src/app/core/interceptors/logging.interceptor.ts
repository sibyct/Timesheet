import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { tap, finalize } from 'rxjs/operators';
import { scopedLogger } from '@core/services/logger.service';
import { HTTP_CONFIG_TOKEN } from '@core/config/app.tokens';
// Singleton scoped logger — DI creates this once, not on every request.
const LOGGER = scopedLogger('LoggingInterceptor');

/**
 * Interceptor that logs each HTTP request's method, URL, status, and timing.
 * Slow-request warnings fire in all environments; debug traces are dev-only.
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LOGGER).withContext('LoggingInterceptor');
  const httpConfig = inject(HTTP_CONFIG_TOKEN);
  const started = Date.now();
  const tag = `[HTTP] ${req.method} ${req.urlWithParams}`;
  let elapsed = 0;

  if (isDevMode()) {
    logger.debug(`${tag} — REQUEST`, {
      method: req.method,
      url: req.urlWithParams,
      body: req.body,
    });
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (!(event instanceof HttpResponse)) return;

        elapsed = Date.now() - started;

        if (isDevMode()) {
          logger.debug(`${tag} — ${event.status}`, {
            status: event.status,
            elapsed: `${elapsed}ms`,
          });
        }

        if (elapsed > httpConfig.performance.slowThreshold) {
          logger.warn(`${tag} — SLOW REQUEST`, {
            elapsed: `${elapsed}ms`,
            threshold: `${httpConfig.performance.slowThreshold}ms`,
          });
        }
      },
      error: (err) => {
        elapsed = Date.now() - started;

        logger.error(`${tag} — ERROR`, {
          status: err?.status ?? 'unknown',
          message: err?.message ?? 'unknown',
          elapsed: `${elapsed}ms`,
        });
      },
    }),
    finalize(() => {
      if (isDevMode()) {
        logger.debug(`${tag} — COMPLETE`, { elapsed: `${elapsed}ms` });
      }
    }),
  );
};
