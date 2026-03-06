/**
 * @file modules/auth/auth.service.ts
 * @description Business logic for authentication.
 *
 * Token strategy:
 *   - Access token  : short-lived JWT (15 min), returned in response body.
 *   - Refresh token : long-lived JWT (7 d), stored as httpOnly cookie AND
 *                     hashed (SHA-256) in User.refreshToken for server-side
 *                     revocation. Using crypto.createHash instead of bcrypt
 *                     because refresh tokens are already high-entropy JWTs
 *                     (no need for the slow key-derivation bcrypt provides for
 *                     low-entropy passwords).
 *
 * Token rotation:
 *   Every successful refresh issues a brand-new token pair and overwrites
 *   the stored hash — the old refresh token is immediately invalidated.
 *
 * Revocation:
 *   logout() and changePassword() (user service) set User.refreshToken = null,
 *   making all existing refresh tokens invalid regardless of their expiry.
 */

import crypto from "crypto";
import { ApiError } from "@utils/ApiError";
import { env } from "@config/env";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "@middlewares/auth.middleware";
import type { RefreshTokenPayload } from "@middlewares/auth.middleware";
import * as userRepo from "@modules/user/user.repository";
import type { LoginBody } from "./auth.validator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** SHA-256 hash of a refresh token for safe DB storage. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// ─── login ────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user with email + password.
 *
 * Steps:
 *   1. Find user by email (with password selected)
 *   2. Verify the plain-text password against the stored bcrypt hash
 *   3. Reject inactive accounts
 *   4. Generate access + refresh token pair
 *   5. Hash refresh token and persist in User.refreshToken
 *   6. Record lastLoginAt
 *
 * @throws 401 for invalid credentials (deliberately vague — no user enumeration)
 */
export async function login(body: LoginBody): Promise<LoginResult> {
  // Load user WITH password (normally excluded by select: false)
  const user = await userRepo.findByEmail(body.username, {
    withPassword: true,
  });

  // Deliberate: same error for "user not found" and "wrong password"
  // to prevent user enumeration attacks.
  const INVALID_CREDS = "Invalid username or password";

  if (!user) throw ApiError.unauthorized(INVALID_CREDS);
  if (!user.isActive)
    throw ApiError.unauthorized("Your account has been deactivated");

  // comparePassword requires the hydrated document (instance method)
  const doc = await userRepo.findDocumentById(String(user._id));
  if (!doc) throw ApiError.unauthorized(INVALID_CREDS);

  const passwordValid = await doc.comparePassword(body.password);
  if (!passwordValid) throw ApiError.unauthorized(INVALID_CREDS);

  // Generate token pair
  const userId = String(user._id);
  const accessToken = generateAccessToken({
    sub: userId,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({ sub: userId, ver: 1 });

  // Persist hashed refresh token + update last login
  await Promise.all([
    userRepo.updateRefreshToken(userId, hashToken(refreshToken)),
    userRepo.touchLastLogin(userId),
  ]);

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}

// ─── logout ───────────────────────────────────────────────────────────────────

/**
 * Invalidates the user's refresh token server-side.
 * The access token will naturally expire; clients should discard it immediately.
 *
 * @param userId - Authenticated user's ID (from req.user)
 */
export async function logout(userId: string): Promise<void> {
  await userRepo.updateRefreshToken(userId, null);
}

// ─── refreshTokens ────────────────────────────────────────────────────────────

/**
 * Issues a new access + refresh token pair from a valid refresh token cookie.
 *
 * Steps:
 *   1. Verify the JWT signature and expiry
 *   2. Load the user; reject if not found or inactive
 *   3. Compare the token hash against User.refreshToken (detects theft/reuse)
 *   4. Issue a new token pair (rotation — old refresh token is immediately dead)
 *   5. Persist the new hash
 *
 * @param cookieToken - Raw refresh JWT from the httpOnly cookie
 * @throws 401 on any failure (invalid JWT, unknown user, hash mismatch)
 */
export async function refreshTokens(cookieToken: string): Promise<LoginResult> {
  // Step 1: verify JWT signature + expiry
  const payload = verifyToken<RefreshTokenPayload>(
    cookieToken,
    env.JWT_REFRESH_SECRET,
  );

  // Step 2: load user WITH refreshToken selected (normally excluded)
  const user = await userRepo.findById(payload.sub, { withRefreshToken: true });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  // Step 3: compare hashes — if they differ the token was already rotated
  //         or was stolen and previously used to rotate
  const storedHash = (user as typeof user & { refreshToken: string | null })
    .refreshToken;
  if (!storedHash || storedHash !== hashToken(cookieToken)) {
    // Potential token reuse attack — invalidate all sessions for this user
    await userRepo.updateRefreshToken(payload.sub, null);
    throw ApiError.unauthorized("Refresh token has been revoked");
  }

  // Step 4: issue new token pair
  const userId = String(user._id);
  const accessToken = generateAccessToken({
    sub: userId,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    sub: userId,
    ver: (payload.ver ?? 0) + 1,
  });

  // Step 5: rotate stored hash
  await userRepo.updateRefreshToken(userId, hashToken(refreshToken));

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}
