/**
 * @file middlewares/auth.middleware.ts
 * @description JWT authentication middleware and token generators.
 *
 * authenticate   — verifies the Bearer access token in every protected route
 * generateTokens — creates a new access + refresh token pair
 * verifyToken    — low-level verify helper (used by auth service + tests)
 *
 * Token strategy (per spec):
 *   - Access token:  short-lived (15 min), signed with JWT_ACCESS_SECRET
 *   - Refresh token: long-lived (7 d), signed with JWT_REFRESH_SECRET,
 *                    stored as an httpOnly cookie + hashed in User.refreshToken
 *   - Access token travels in Authorization: Bearer <token> header only —
 *     NEVER in a cookie to prevent CSRF.
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "@config/env";

type JwtExpiresIn = SignOptions["expiresIn"];
import { ApiError } from "@utils/ApiError";
import type { UserRole } from "@models/index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string; // User._id (string)
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string; // User._id (string)
  /** Incrementing token version — allows server-side revocation */
  ver: number;
}

/** The shape attached to req.user after authenticate() runs */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ─── Token Generators ─────────────────────────────────────────────────────────

/**
 * Creates a signed JWT access token for the given user.
 * Short-lived (default 15 min) — stored in memory on the client, not persisted.
 *
 * @param payload - User identity fields to embed in the token
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as JwtExpiresIn,
    // subject: payload.sub,
  });
}

/**
 * Creates a signed JWT refresh token.
 * Long-lived (default 7 d) — sent as an httpOnly, Secure, SameSite=Strict cookie.
 * The hash of this token is stored in User.refreshToken for revocation.
 *
 * @param payload - Minimal user identity + token version
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as JwtExpiresIn,
  });
}

/**
 * Verifies and decodes a JWT token.
 *
 * @param token  - Raw JWT string
 * @param secret - Secret used to verify the signature
 * @returns Decoded payload
 * @throws ApiError 401 if the token is invalid, expired, or malformed
 */
export function verifyToken<T extends object>(
  token: string,
  secret: string,
): T {
  try {
    return jwt.verify(token, secret) as T;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Token has expired");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized("Invalid token");
    }
    throw ApiError.unauthorized("Token verification failed");
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Express middleware that authenticates incoming requests.
 *
 * Expects:  Authorization: Bearer <access_token>
 * Attaches: req.user = { id, email, role, iat, exp }
 *
 * Throws:
 *   401 — missing header, malformed header, invalid token, expired token
 *
 * Does NOT check roles — use authorize() after authenticate() for that.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(ApiError.unauthorized("Authorization header is missing"));
  }

  if (!authHeader.startsWith("Bearer ")) {
    return next(
      ApiError.unauthorized("Authorization header must use Bearer scheme"),
    );
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return next(ApiError.unauthorized("Bearer token is empty"));
  }

  try {
    const decoded = verifyToken<
      AccessTokenPayload & { iat: number; exp: number }
    >(token, env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (err) {
    next(err);
  }
}

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

/** Max-age for the refresh token cookie in milliseconds (7 days). */
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Attaches the refresh token as an httpOnly cookie on the response.
 * Call this once at login and at every token refresh.
 *
 * @param res          - Express Response
 * @param refreshToken - Signed refresh JWT
 */
export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV !== "development", // HTTPS only in non-dev
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/api/v1/auth/refresh-token", // Restrict cookie to refresh endpoint
  });
}

/**
 * Clears the refresh token cookie.
 * Call this on logout.
 *
 * @param res - Express Response
 */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/api/v1/auth/refresh-token",
  });
}
