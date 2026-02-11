import { email, z } from "zod";

// Register validator
export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  emailAddress: z.email("Invalid email address"),
  phoneNo: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.number().int().optional().default(1), // 1 = employee
  contractType: z.string().optional(),
  hourlyPay: z.number().nonnegative("Hourly pay must be positive").optional(),
  projects: z.array(z.string()).optional(),
  clients: z.array(z.string()).optional(),
  address: z.string().optional(),
  address2: z.string().optional(),
});

// Login validator
export const loginSchema = z.object({
  emailAddress: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});
