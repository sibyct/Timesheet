import { HttpInterceptorFn } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { tap, finalize } from 'rxjs/operators';

/**
 * Dev-only interceptor that logs each HTTP request's method, URL,
 * status code, and elapsed time to the browser console.
 * Compiled out automatically in production builds (tree-shaken via isDevMode()).
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isDevMode()) {
    return next(req);
  }

  const started = Date.now();
  const tag = `[HTTP] ${req.method} ${req.urlWithParams}`;

  return next(req).pipe(
    tap({
      next:  (event) => {
        if ((event as { type?: number }).type !== 0) return; // skip UploadProgress etc.
      },
      error: (err) => {
        const elapsed = Date.now() - started;
        console.warn(`${tag} — ERROR ${err?.status ?? '?'} (${elapsed}ms)`, err);
      },
    }),
    finalize(() => {
      const elapsed = Date.now() - started;
      console.debug(`${tag} — ${elapsed}ms`);
    }),
  );
};
