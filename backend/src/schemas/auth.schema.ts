import { z } from "zod";

// POST /api/auth/register — all fields required.
export const registerSchema = z.object({
  email: z.email("Invalid email").trim(),
  name: z.string().trim().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST /api/auth/login — email + password only.
export const loginSchema = z.object({
  email: z.email("Invalid email").trim(),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/forgot-password — just the email to send a reset link to.
export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email").trim(),
});

// POST /api/auth/reset-password — the token from the email + the new password.
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
