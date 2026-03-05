/**
 * @file types/express.d.ts
 * @description Augments the Express Request interface with project-specific
 * properties added by middleware.
 *
 * req.user  — attached by authenticate() after JWT verification
 * req.id    — attached by pino-http as a unique request ID
 */

import type { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      /**
       * Decoded JWT payload, attached by `authenticate` middleware.
       * Undefined on public routes that skip authentication.
       */
      user?: {
        id:         string;
        email:      string;
        role:       UserRole;
        /** Raw JWT issued-at timestamp (Unix seconds) */
        iat:        number;
        /** Raw JWT expiry timestamp (Unix seconds) */
        exp:        number;
      };
    }
  }
}

// Needed to make this file a module (not a script) so the global augmentation works.
export {};
