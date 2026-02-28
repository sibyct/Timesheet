import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ status: 'Validation error', errors: result.error.flatten().fieldErrors });
      return;
    }
    next();
  };
}

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const saveProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  emailAddress: z.string().email().optional().or(z.literal('')),
  phoneNo: z.string().optional(),
  address: z.string().optional(),
  address2: z.string().optional(),
});
