import { Injectable, InjectionToken, inject, isDevMode } from '@angular/core';

/**
 * Creates a scoped logger singleton for a named context.
 * Use this instead of calling `inject(LoggerService).withContext(name)` inside
 * a function body — that pattern allocates a new instance on every call.
 *
 * @example
 * // Define once (e.g. at the top of an interceptor or service file):
 * const MY_LOGGER = scopedLogger('MyFeature');
 *
 * // Inject:
 * const logger = inject(MY_LOGGER);
 */
export function scopedLogger(context: string): InjectionToken<LoggerService> {
  return new InjectionToken<LoggerService>(`Logger[${context}]`, {
    providedIn: 'root',
    factory: () => inject(LoggerService).withContext(context),
  });
}

// ─── Log levels ───────────────────────────────────────────────────────────────
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // suppresses all output
}

// ─── Colour map for console grouping ─────────────────────────────────────────
const LEVEL_STYLE: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'color:#94a3b8;font-weight:500', // slate-400
  [LogLevel.INFO]: 'color:#38bdf8;font-weight:500', // sky-300
  [LogLevel.WARN]: 'color:#fbbf24;font-weight:600', // amber-400
  [LogLevel.ERROR]: 'color:#f87171;font-weight:700', // red-400
  [LogLevel.NONE]: '',
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO ',
  [LogLevel.WARN]: 'WARN ',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: '',
};

/**
 * Application-wide structured logger.
 *
 * - Development default: LogLevel.DEBUG  (all messages)
 * - Production default:  LogLevel.WARN   (warnings and errors only)
 *
 * Scoped child loggers keep related log lines grouped by context:
 *
 * @example
 * // Root logger
 * private logger = inject(LoggerService);
 * this.logger.info('App started');
 *
 * // Scoped logger — prefix every line with [TimesheetEffect]
 * private log = inject(LoggerService).withContext('TimesheetEffect');
 * this.log.debug('loadWeek dispatched', { weekStart });
 * this.log.error('loadWeek failed', error);
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private level: LogLevel = isDevMode() ? LogLevel.DEBUG : LogLevel.WARN;
  private context: string | null = null;

  // ── Level control ──────────────────────────────────────────────────────────

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  // ── Scoped child logger ────────────────────────────────────────────────────

  /**
   * Returns a new LoggerService instance that prefixes every message with
   * `[context]` and inherits the current log level.
   */
  withContext(context: string): LoggerService {
    const child = new LoggerService();
    child.level = this.level;
    child.context = context;
    return child;
  }

  // ── Log methods ───────────────────────────────────────────────────────────

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, args);
  }

  // ── Core implementation ───────────────────────────────────────────────────

  private log(level: LogLevel, message: string, args: unknown[]): void {
    if (level < this.level) return;

    const label = LEVEL_LABEL[level];
    const style = LEVEL_STYLE[level];
    const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.mmm
    const ctx = this.context ? ` [${this.context}]` : '';
    const prefix = `%c[${ts}] ${label}${ctx}`;

    switch (level) {
      case LogLevel.DEBUG:
        args.length
          ? console.debug(prefix, style, message, ...args)
          : console.debug(prefix, style, message);
        break;

      case LogLevel.INFO:
        args.length
          ? console.info(prefix, style, message, ...args)
          : console.info(prefix, style, message);
        break;

      case LogLevel.WARN:
        args.length
          ? console.warn(prefix, style, message, ...args)
          : console.warn(prefix, style, message);
        break;

      case LogLevel.ERROR:
        args.length
          ? console.error(prefix, style, message, ...args)
          : console.error(prefix, style, message);
        break;
    }
  }
}
