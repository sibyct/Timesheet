import {
  ErrorHandler,
  Injectable,
  Injector,
  inject,
  isDevMode,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { LoggerService } from '../services/logger.service';

/**
 * Application-wide error handler.
 *
 * Catches all unhandled JavaScript runtime errors that escape Angular's
 * zone (uncaught exceptions, Promise rejections bubbling up, etc.).
 *
 * Responsibilities:
 *  - HTTP errors  → delegated entirely to errorInterceptor; ignored here.
 *  - Runtime errors in dev  → verbose console output for debugging.
 *  - Runtime errors in prod → placeholder hook for a remote error-tracking
 *                             service (e.g. Sentry) + silent console.error.
 *  - All runtime errors → user-facing notification via NotificationService.
 *
 * Registration (app.config.ts):
 *   { provide: ErrorHandler, useClass: GlobalErrorHandler }
 *
 * DI note: ErrorHandler is one of the first providers Angular instantiates.
 * Using `Injector` for lazy resolution avoids potential circular-dependency
 * issues that arise when injecting services directly at construction time.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  // ✅ Resolved once — not on every access
  private readonly logger = this.injector
    .get(LoggerService)
    .withContext('GlobalErrorHandler');

  private readonly notify = this.injector.get(NotificationService);

  handleError(error: unknown): void {
    // ✅ HTTP errors already handled by errorInterceptor
    if (error instanceof HttpErrorResponse) return;

    const message = this.extractMessage(error);

    // ✅ Structured payload with dev/prod distinction
    this.logger.error(message, {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...(isDevMode() && {
        stack: error instanceof Error ? error.stack : undefined,
        raw: error instanceof Error ? error.message : error,
      }),
    });

    // ✅ Notify user with fallback console log
    try {
      this.notify.error(message);
    } catch (notifyError) {
      console.error(
        '[GlobalErrorHandler] NotificationService failed',
        notifyError,
      );
    }
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === 'string' && error.length > 0) {
      return error;
    }
    return 'An unexpected application error occurred.';
  }
}
