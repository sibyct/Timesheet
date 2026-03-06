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
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

function isApiEnvelope(body: unknown): body is ApiEnvelope {
  return (
    body !== null &&
    typeof body === 'object' &&
    'success' in body &&
    'data' in body
  );
}

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && isApiEnvelope(event.body)) {
        return event.clone({ body: event.body.data });
      }
      return event;
    }),
  );
