/**
 * @file modules/auth/auth.validator.ts
 * @description Zod schemas for the Auth module.
 */

import { z } from 'zod';

/** Body schema for POST /auth/login */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Must be a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type LoginBody = z.infer<typeof loginSchema>;
