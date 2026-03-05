/**
 * @file modules/auth/auth.controller.ts
 * @description HTTP adapter for the Auth module.
 *
 * Routes served:
 *   POST /auth/login          → login
 *   POST /auth/logout         → logout
 *   POST /auth/refresh-token  → refresh
 */

import type { Request, Response } from 'express';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';
import { setRefreshCookie, clearRefreshCookie } from '@middlewares/auth.middleware';
import * as service from './auth.service';
import type { LoginBody } from './auth.validator';

// ─── login ────────────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 *
 * Returns the access token in the response body.
 * Sets the refresh token as an httpOnly cookie (path restricted to /auth/refresh-token).
 */
export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginBody;
  const result = await service.login(body);

  setRefreshCookie(res, result.refreshToken);

  ApiResponse.ok(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
}

// ─── logout ───────────────────────────────────────────────────────────────────

/**
 * POST /auth/logout
 *
 * Invalidates the server-side refresh token and clears the cookie.
 * The access token will expire naturally — clients must discard it.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  await service.logout(req.user!.id);

  clearRefreshCookie(res);

  ApiResponse.ok(res, null, 'Logged out successfully');
}

// ─── refresh ──────────────────────────────────────────────────────────────────

/**
 * POST /auth/refresh-token
 *
 * Reads the refresh token from the httpOnly cookie.
 * Issues a new access + refresh token pair (token rotation).
 * Sets the new refresh token cookie and returns the new access token.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const cookieToken = req.cookies['refreshToken'] as string | undefined;

  if (!cookieToken) {
    throw ApiError.unauthorized('Refresh token cookie is missing');
  }

  const result = await service.refreshTokens(cookieToken);

  setRefreshCookie(res, result.refreshToken);

  ApiResponse.ok(res, { accessToken: result.accessToken, user: result.user }, 'Token refreshed successfully');
}
