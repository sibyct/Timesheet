/**
 * @file utils/catchAsync.ts
 * @description Higher-order function that wraps async Express route handlers.
 *
 * Eliminates the need for try/catch blocks in every controller.
 * Any rejected promise is forwarded to Express's `next(err)`, which
 * routes it to the central error handler middleware.
 *
 * Usage:
 *   router.get('/users', catchAsync(userController.list));
 *
 *   // Instead of:
 *   router.get('/users', async (req, res, next) => {
 *     try { ... } catch (err) { next(err); }
 *   });
 *
 * Works with all Express handler signatures:
 *   - (req, res, next)                          → route handler
 *   - (req, res)                                → route handler without next
 *   - (err, req, res, next)                     → error middleware (4-arg)
 */

import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

// ─── Type Aliases ─────────────────────────────────────────────────────────────

/**
 * An async Express route handler that may or may not use `next`.
 * The return value is always ignored by Express — Promise<void> is conventional.
 */
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

// ─── catchAsync ───────────────────────────────────────────────────────────────

/**
 * Wraps an async Express handler so that any thrown error or rejected
 * promise is forwarded to Express's next(err) automatically.
 *
 * @param fn - Async route handler to wrap
 * @returns  Synchronous RequestHandler compatible with express.Router
 *
 * @example
 * // In a controller file:
 * export const getUser = catchAsync(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   ApiResponse.ok(res, user, 'User retrieved');
 * });
 */
export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
