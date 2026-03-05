/**
 * @file utils/ApiError.ts
 * @description Custom operational error class for the API.
 *
 * Distinguishes between:
 *   - Operational errors   (isOperational = true)  — known, expected failures
 *     e.g. 404 Not Found, 401 Unauthorized, 422 Validation
 *   - Programmer errors    (isOperational = false) — bugs, caught by global handler
 *     e.g. undefined reference, DB connection failure
 *
 * The global error handler uses `isOperational` to decide whether to send
 * the real message to the client or a generic "Internal server error".
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of a single validation error field. */
export interface FieldError {
  field: string;
  message: string;
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  /** HTTP status code to send in the response. */
  public readonly statusCode: number;

  /**
   * true  → expected application error (send real message to client)
   * false → unexpected programmer error (send generic message, log full stack)
   */
  public readonly isOperational: boolean;

  /**
   * Optional per-field validation errors.
   * Populated when throwing a 422 Unprocessable Entity from Zod.
   */
  public readonly errors: FieldError[];

  constructor(
    statusCode: number,
    message: string,
    errors: FieldError[] = [],
    isOperational = true,
  ) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    // Maintains a proper prototype chain for `instanceof` checks.
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture a clean stack trace (excludes the ApiError constructor itself).
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Static Factory Methods ────────────────────────────────────────────────

  /** 400 Bad Request */
  static badRequest(message = 'Bad request', errors: FieldError[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  /** 401 Unauthorized — missing or invalid token */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /** 403 Forbidden — valid token, insufficient role */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /** 404 Not Found */
  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, `${resource} not found`);
  }

  /** 409 Conflict — e.g. duplicate email */
  static conflict(message = 'Conflict'): ApiError {
    return new ApiError(409, message);
  }

  /** 422 Unprocessable Entity — Zod validation failure */
  static validation(errors: FieldError[], message = 'Validation failed'): ApiError {
    return new ApiError(422, message, errors);
  }

  /** 429 Too Many Requests */
  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  /**
   * 500 Internal Server Error.
   * isOperational = false so the global handler logs the full stack
   * and sends a generic message to the client.
   */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, [], false);
  }
}
