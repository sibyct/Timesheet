/**
 * @file middlewares/authorize.middleware.ts
 * @description Role-Based Access Control (RBAC) middleware.
 *
 * Must be used AFTER authenticate() — requires req.user to be set.
 *
 * Role hierarchy (as specified):
 *   employee  — own timesheets only
 *   manager   — own timesheets + approve team timesheets + team reports
 *   admin     — full access + user management + system settings
 *
 * Usage:
 *   router.get('/admin/users',
 *     authenticate,
 *     authorize('admin'),
 *     catchAsync(userController.list),
 *   );
 *
 *   router.get('/approvals/queue',
 *     authenticate,
 *     authorize('manager', 'admin'),
 *     catchAsync(approvalController.queue),
 *   );
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from '@utils/ApiError';
import type { UserRole } from '@models/index';

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

/**
 * Numeric weight per role — higher = more privileged.
 * Used by `authorizeMinRole` for hierarchy-based checks.
 */
const ROLE_WEIGHT: Record<UserRole, number> = {
  employee: 1,
  manager:  2,
  admin:    3,
};

// ─── authorize ────────────────────────────────────────────────────────────────

/**
 * Middleware factory that restricts a route to one or more specific roles.
 *
 * @param roles - One or more roles that are allowed to access the route.
 *                At least one of the listed roles must match req.user.role.
 * @returns Express middleware that throws 403 Forbidden if the check fails
 *
 * @example
 * router.delete('/users/:id', authenticate, authorize('admin'), handler);
 * router.get('/approvals',    authenticate, authorize('manager', 'admin'), handler);
 */
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      // authenticate() should always run first — this is a programmer error
      return next(
        new ApiError(500, 'authorize() called before authenticate()', [], false),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${roles.join(' or ')}`,
        ),
      );
    }

    next();
  };
}

// ─── authorizeMinRole ─────────────────────────────────────────────────────────

/**
 * Middleware factory that requires the user's role to be at least as privileged
 * as `minRole` in the role hierarchy (employee < manager < admin).
 *
 * Prefer `authorize()` for explicit role lists.
 * Use `authorizeMinRole` when any role at or above a threshold is acceptable.
 *
 * @param minRole - Minimum required role
 *
 * @example
 * // Allow manager AND admin (both have weight ≥ manager)
 * router.get('/reports', authenticate, authorizeMinRole('manager'), handler);
 */
export function authorizeMinRole(minRole: UserRole): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new ApiError(500, 'authorizeMinRole() called before authenticate()', [], false),
      );
    }

    const userWeight = ROLE_WEIGHT[req.user.role];
    const minWeight  = ROLE_WEIGHT[minRole];

    if (userWeight < minWeight) {
      return next(
        ApiError.forbidden(
          `Access denied. Minimum required role: ${minRole}`,
        ),
      );
    }

    next();
  };
}

// ─── authorizeOwnerOrAdmin ────────────────────────────────────────────────────

/**
 * Middleware factory that allows access if the requesting user is either:
 *   a) the resource owner (req.user.id === resourceUserId), OR
 *   b) an admin
 *
 * The `getUserId` function extracts the owner's ID from the request
 * (typically from req.params).
 *
 * @param getUserId - Function that extracts the owner's user ID from the request
 *
 * @example
 * // Only the employee themselves or an admin can view their timesheet
 * router.get('/timesheets/:userId',
 *   authenticate,
 *   authorizeOwnerOrAdmin((req) => req.params['userId'] ?? ''),
 *   handler,
 * );
 */
export function authorizeOwnerOrAdmin(
  getUserId: (req: Request) => string,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new ApiError(500, 'authorizeOwnerOrAdmin() called before authenticate()', [], false),
      );
    }

    const resourceOwnerId = getUserId(req);
    const isOwner = req.user.id === resourceOwnerId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('You can only access your own resources'));
    }

    next();
  };
}
