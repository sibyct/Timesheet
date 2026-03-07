import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
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
  // Lazy injector — prevents circular DI during bootstrap
  private readonly injector = inject(Injector);

  private get logger(): LoggerService {
    return this.injector.get(LoggerService).withContext('GlobalErrorHandler');
  }

  private get notify(): NotificationService {
    return this.injector.get(NotificationService);
  }

  handleError(error: unknown): void {
    // ── HTTP errors ─────────────────────────────────────────────────────────
    // Already handled (logged + notified) by errorInterceptor.
    // Re-throwing here would double-notify the user.
    if (error instanceof HttpErrorResponse) {
      return;
    }

    const message = this.extractMessage(error);

    // ── Logging ─────────────────────────────────────────────────────────────
    // In dev: full stack trace; in prod: message only.
    // Production hook → swap logger.error for an error-tracking call:
    //   inject(ErrorTrackingService).capture(error);
    this.logger.error(message, error);

    // ── User notification ───────────────────────────────────────────────────
    // Guard against NotificationService itself throwing (e.g. Store not ready)
    try {
      this.notify.error(message);
    } catch {
      // Swallow — avoids infinite loop if the notification system is broken
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred.';
    }
    if (typeof error === 'string' && error.length > 0) {
      return error;
    }
    return 'An unexpected application error occurred.';
  }
}
