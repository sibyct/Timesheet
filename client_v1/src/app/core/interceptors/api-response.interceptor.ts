/**
 * @file core/interceptors/api-response.interceptor.ts
 *
 * Unwraps the standard API envelope:
 *   { success: true, message: string, data: T }
 * so every service receives T directly instead of the envelope.
 *
 * Only transforms successful HttpResponse bodies that match the envelope shape.
 * Pass-through for non-JSON responses (blobs, plain text, etc.).
 */
import { inject, isDevMode } from '@angular/core';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { LoggerService } from '@core/services/logger.service';

interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// ✅ Guards all three fields + success must be true
function isApiEnvelope(body: unknown): body is ApiEnvelope {
  return (
    body !== null &&
    typeof body === 'object' &&
    'success' in body &&
    'message' in body &&
    'data' in body &&
    (body as ApiEnvelope).success === true
  );
}

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService).withContext('ApiResponseInterceptor');

  return next(req).pipe(
    map((event) => {
      if (!(event instanceof HttpResponse)) return event;
      if (!isApiEnvelope(event.body)) return event;

      if (isDevMode()) {
        logger.debug('Envelope unwrapped', {
          url: req.url,
          message: event.body.message,
        });
      }

      return event.clone({
        body: event.body.data,
        headers: event.headers.set('X-Api-Message', event.body.message),
      });
    }),
  );
};
